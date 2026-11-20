"use client";
import { PageShell } from "@/components/dashboard/page-header";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type FormValues = {
  programmeName: string;
  topicProposed: string;
  outreachChannel: string;
  estimatedReach: string;
  notes: string;
  pitchSentAt: string;
  followUpDate: string;
  interviewDate: string;
};

const CHANNELS = ["Email", "LinkedIn", "WhatsApp", "Phone", "Website form", "Introduction", "Event", "Other"];

export default function NewOpportunityPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState("");
  const [contactId, setContactId] = useState("");
  const [spokespersonId, setSpokespersonId] = useState("");

  const { data: orgsData } = trpc.media.listOrgs.useQuery({ limit: 100 });
  const orgs = (orgsData as any)?.orgs ?? [];

  // Load contacts for selected org
  const { data: orgDetail } = trpc.media.listOrgs.useQuery(
    { limit: 1, search: orgs.find((o: any) => o.id === orgId)?.name },
    { enabled: !!orgId }
  );

  const { data: adminUsers } = trpc.ambassadors.list.useQuery({ limit: 100 });

  const create = trpc.media.createOpportunity.useMutation({
    onSuccess: () => router.push("/admin/media/opportunities"),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    if (!orgId) return;
    create.mutate({
      organisationId: orgId,
      contactId: contactId || undefined,
      spokespersonUserId: spokespersonId || undefined,
      programmeName: data.programmeName || undefined,
      topicProposed: data.topicProposed,
      outreachChannel: data.outreachChannel || undefined,
      estimatedReach: data.estimatedReach ? Number(data.estimatedReach) : undefined,
      notes: data.notes || undefined,
      pitchSentAt: data.pitchSentAt ? new Date(data.pitchSentAt) : undefined,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
    });
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div className="mb-5">
        <h1 className="text-base font-bold text-gray-900">New Media Opportunity</h1>
        <p className="text-gray-500 mt-1">Track a new podcast pitch, interview or media outreach</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {create.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {create.error.message}
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Organisation & Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Media Organisation *</label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organisation" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} — {org.type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!orgId && create.isPending && (
                <p className="text-xs text-red-600">Select an organisation</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Truehost Spokesperson</label>
              <Select value={spokespersonId} onValueChange={setSpokespersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Who will represent Truehost?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not assigned yet</SelectItem>
                  {(adminUsers as any)?.ambassadors?.map((a: any) => (
                    <SelectItem key={a.user.id} value={a.user.id}>
                      {a.user.firstName} {a.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Opportunity Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Programme / Show Name"
              placeholder="e.g. TechTrendsKE Episode 42"
              {...register("programmeName")}
            />
            <Textarea
              label="Topic Proposed *"
              placeholder="e.g. Cloud computing for startups in East Africa — Truehost's perspective"
              rows={3}
              {...register("topicProposed", { required: "Topic is required" })}
              error={errors.topicProposed?.message}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Outreach Channel</label>
              <Select
                value=""
                onValueChange={(v) => {
                  // Using native select logic via register isn't possible cleanly here
                  // so we store it separately
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did we reach out?" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or type the channel..." {...register("outreachChannel")} />
            </div>
            <Input
              label="Estimated Audience Reach"
              type="number"
              placeholder="e.g. 15000"
              {...register("estimatedReach")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dates</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input label="Pitch Sent Date" type="date" {...register("pitchSentAt")} />
            <Input label="Follow-up Date" type="date" {...register("followUpDate")} />
            <Input label="Interview / Recording Date" type="date" {...register("interviewDate")} className="col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes, context or background..."
              rows={3}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={create.isPending}>Save Opportunity</Button>
        </div>
      </form>
    </div>
  );
}
