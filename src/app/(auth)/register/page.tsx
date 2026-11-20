"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { data: institutions } = trpc.chapters.listInstitutions.useQuery();
  const register_mutation = trpc.auth.register.useMutation({
    onSuccess: () => router.push("/login?registered=1"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterInput) => {
    register_mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 mb-4">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Campus Builders</h1>
          <p className="text-gray-500 mt-1">Create your ambassador account</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {register_mutation.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {register_mutation.error.message}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="firstName"
                    label="First name"
                    placeholder="Amani"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <Input
                    id="lastName"
                    label="Last name"
                    placeholder="Kamau"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                </div>
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="amani@university.ac.ke"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  id="phone"
                  label="Phone number (optional)"
                  placeholder="+254 7XX XXX XXX"
                  {...register("phone")}
                />
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="At least 8 characters"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <Button type="button" className="w-full" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Institution</label>
                  <Select onValueChange={(v) => setValue("institutionId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university or TVET" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions?.map((inst: { id: string; name: string; type: string }) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} ({inst.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.institutionId && (
                    <p className="text-xs text-red-600">{errors.institutionId.message}</p>
                  )}
                </div>
                <Input
                  id="course"
                  label="Course / Programme"
                  placeholder="B.Sc. Computer Science"
                  {...register("course")}
                />
                <Input
                  id="studentId"
                  label="Student ID (optional)"
                  placeholder="Your institution ID"
                  {...register("studentId")}
                />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={register_mutation.isPending}
                  >
                    Create Account
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
