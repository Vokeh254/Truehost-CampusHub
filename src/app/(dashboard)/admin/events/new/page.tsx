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
  name: string;
  organiser: string;
  description: string;
  location: string;
  eventDate: string;
  registrationDeadline: string;
  website: string;
  applicationUrl: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  targetAudience: string;
  estimatedParticipants: string;
};

const CATEGORIES = [
  { value: "TECH_CONFERENCE", label: "Technology Conference" },
  { value: "UNIVERSITY_WORKSHOP", label: "University Workshop" },
  { value: "HACKATHON", label: "Hackathon" },
  { value: "DEVELOPER_MEETUP", label: "Developer Meetup" },
  { value: "CAREER_FAIR", label: "Career Fair" },
  { value: "STARTUP_EVENT", label: "Startup Event" },
  { value: "INNOVATION_EXHIBITION", label: "Innovation Exhibition" },
  { value: "ENTREPRENEURSHIP", label: "Entrepreneurship Programme" },
  { value: "WEBINAR", label: "Webinar" },
  { value: "TRAINING", label: "Training Programme" },
  { value: "RESEARCH_EVENT", label: "Research Event" },
  { value: "COMPETITION", label: "Technology Competition" },
  { value: "OTHER", label: "Other" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [opportunities, setOpportunities] = useState({
    partnershipOpportunity: false,
    speakerOpportunity: false,
    sponsorshipOpportunity: false,
    exhibitionOpportunity: false,
  });

  const { data: chapters } = trpc.chapters.list.useQuery({ limit: 100 });
  const [chapterId, setChapterId] = useState("");

  const create = trpc.events.create.useMutation({
    onSuccess: (ev: any) => router.push(`/admin/events/${ev.id}`),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    if (!category) return;
    create.mutate({
      name: data.name,
      organiser: data.organiser,
      description: data.description,
      category: category as any,
      location: data.location,
      isOnline,
      eventDate: new Date(data.eventDate),
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      website: data.website || undefined,
      applicationUrl: data.applicationUrl || undefined,
      contactPerson: data.contactPerson || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      targetAudience: data.targetAudience || undefined,
      estimatedParticipants: data.estimatedParticipants ? Number(data.estimatedParticipants) : undefined,
      chapterId: chapterId || undefined,
      ...opportunities,
    });
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div className="mb-5">
        <h1 className="text-base font-bold text-gray-900">Add Event / Opportunity</h1>
        <p className="text-gray-500 mt-1">Track a new event or industry opportunity</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {create.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {create.error.message}
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Event Name *"
              placeholder="e.g. iHub Tech Summit 2024"
              {...register("name", { required: "Event name is required" })}
              error={errors.name?.message}
            />
            <Input
              label="Organiser *"
              placeholder="e.g. iHub, BAKE, Nairobi Tech Week"
              {...register("organiser", { required: "Organiser is required" })}
              error={errors.organiser?.message}
            />
            <Textarea
              label="Description *"
              placeholder="What is this event about? Who attends?"
              rows={3}
              {...register("description", { required: "Description is required" })}
              error={errors.description?.message}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Category *</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Event Date *"
                type="date"
                {...register("eventDate", { required: "Date is required" })}
                error={errors.eventDate?.message}
              />
              <Input
                label="Registration Deadline"
                type="date"
                {...register("registrationDeadline")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnline"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isOnline" className="text-sm text-gray-700">Online / Virtual event</label>
            </div>

            <Input
              label={isOnline ? "Online Link / Platform" : "Location"}
              placeholder={isOnline ? "https://zoom.us/..." : "e.g. Kenyatta University, Nairobi"}
              {...register("location", { required: "Location is required" })}
              error={errors.location?.message}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Associated Chapter (optional)</label>
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger>
                  <SelectValue placeholder="National / All chapters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">National / All chapters</SelectItem>
                  {(chapters as any)?.chapters?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input label="Contact Person" placeholder="Event coordinator name" {...register("contactPerson")} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Email" type="email" {...register("contactEmail")} />
              <Input label="Contact Phone" placeholder="+254 7XX XXX XXX" {...register("contactPhone")} />
            </div>
            <Input label="Official Website" type="url" placeholder="https://..." {...register("website")} />
            <Input label="Application / Registration URL" type="url" placeholder="https://..." {...register("applicationUrl")} />
            <Input
              label="Target Audience"
              placeholder="e.g. University students, developers, startups"
              {...register("targetAudience")}
            />
            <Input
              label="Estimated Participants"
              type="number"
              placeholder="e.g. 500"
              {...register("estimatedParticipants")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Opportunity Flags</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Flag which Truehost participation opportunities this event offers:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(opportunities) as (keyof typeof opportunities)[]).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={opportunities[key]}
                    onChange={(e) => setOpportunities(o => ({ ...o, [key]: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, " $1").replace("Opportunity", "").trim()}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={create.isPending}>
            Save Event
          </Button>
        </div>
      </form>
    </div>
  );
}
