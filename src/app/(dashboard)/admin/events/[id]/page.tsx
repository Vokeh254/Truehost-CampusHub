"use client";
import { PageShell } from "@/components/dashboard/page-header";
import { use } from "react";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatDateTime, statusColor, timeAgo } from "@/lib/utils";
import {
  Calendar, MapPin, Globe, User, Mail, Phone,
  Plus, ExternalLink, ChevronRight, MessageSquare,
} from "lucide-react";

interface Props { params: Promise<{ id: string }> }

const STATUS_OPTIONS = [
  "DISCOVERED", "UNDER_REVIEW", "CONTACTED", "APPLICATION_SUBMITTED",
  "FOLLOW_UP_REQUIRED", "CONFIRMED", "ATTENDED", "COMPLETED",
  "REJECTED", "UNSUCCESSFUL", "CANCELLED", "POSTPONED",
];

const INTERACTION_TYPES = [
  "INITIAL_CONTACT", "FOLLOW_UP", "PITCH_SENT", "PROPOSAL_SENT",
  "MEETING", "CALL", "EMAIL", "LINKEDIN", "RESPONSE_RECEIVED",
  "NEGOTIATION", "AGREEMENT", "POST_EVENT",
];

const CHANNELS = ["Email", "Phone", "LinkedIn", "WhatsApp", "In-person", "Website form", "Other"];

export default function EventDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: event, isLoading, refetch } = trpc.events.byId.useQuery({ id: id });
  const updateStatus = trpc.events.updateStatus.useMutation({ onSuccess: () => refetch() });
  const addInteraction = trpc.events.addInteraction.useMutation({ onSuccess: () => refetch() });
  const registerMe = trpc.events.register.useMutation({ onSuccess: () => refetch() });

  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interaction, setInteraction] = useState({
    interactionType: "EMAIL",
    channel: "Email",
    summary: "",
    interactedAt: new Date().toISOString().split("T")[0],
    followUpDate: "",
  });

  if (isLoading) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div className="animate-pulse h-8 w-64 bg-gray-200 rounded" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!event) return <div className="p-6 text-gray-500">Event not found.</div>;

  const ev = event as any;

  const handleInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInteraction.mutate({
      eventId: ev.id,
      interactionType: interaction.interactionType as any,
      channel: interaction.channel,
      summary: interaction.summary,
      interactedAt: new Date(interaction.interactedAt),
      followUpDate: interaction.followUpDate ? new Date(interaction.followUpDate) : undefined,
    });
    setInteraction({ interactionType: "EMAIL", channel: "Email", summary: "", interactedAt: new Date().toISOString().split("T")[0], followUpDate: "" });
    setShowInteractionForm(false);
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-900">{ev.name}</h1>
          <p className="text-gray-500 mt-1">{ev.organiser} · {ev.category.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={ev.status}
            onValueChange={(v) => updateStatus.mutate({ id: ev.id, status: v as any })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className={statusColor(ev.status)}>
            {ev.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader><CardTitle>Event Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 text-sm">{ev.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Event Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(ev.eventDate)}</p>
                  </div>
                </div>
                {ev.registrationDeadline && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Reg. Deadline</p>
                      <p className="text-gray-900">{formatDate(ev.registrationDeadline)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Location</p>
                    <p className="text-gray-900">{ev.isOnline ? "Online" : ev.location}</p>
                  </div>
                </div>
                {ev.estimatedParticipants && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Est. Participants</p>
                    <p className="text-gray-900">{ev.estimatedParticipants.toLocaleString()}</p>
                  </div>
                )}
                {ev.targetAudience && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Target Audience</p>
                    <p className="text-gray-900">{ev.targetAudience}</p>
                  </div>
                )}
              </div>

              {/* Opportunity flags */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Opportunities</p>
                <div className="flex gap-2 flex-wrap">
                  {ev.speakerOpportunity && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium"> Speaker</span>}
                  {ev.sponsorshipOpportunity && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium"> Sponsorship</span>}
                  {ev.partnershipOpportunity && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"> Partnership</span>}
                  {ev.exhibitionOpportunity && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"> Exhibition</span>}
                  {!ev.speakerOpportunity && !ev.sponsorshipOpportunity && !ev.partnershipOpportunity && !ev.exhibitionOpportunity && (
                    <span className="text-sm text-gray-400">No specific opportunities flagged</span>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-4 flex-wrap">
                {ev.website && (
                  <a href={ev.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Button>
                  </a>
                )}
                {ev.applicationUrl && (
                  <a href={ev.applicationUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply / Register
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Organiser Interactions
                {ev.interactions?.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">({ev.interactions.length})</span>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setShowInteractionForm(!showInteractionForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </CardHeader>
            <CardContent>
              {showInteractionForm && (
                <form onSubmit={handleInteractionSubmit} className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                  <p className="font-medium text-sm text-blue-900">New Interaction</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-700">Type</label>
                      <Select value={interaction.interactionType} onValueChange={(v) => setInteraction(i => ({ ...i, interactionType: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERACTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-700">Channel</label>
                      <Select value={interaction.channel} onValueChange={(v) => setInteraction(i => ({ ...i, channel: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      label="Date"
                      type="date"
                      value={interaction.interactedAt}
                      onChange={(e) => setInteraction(i => ({ ...i, interactedAt: e.target.value }))}
                    />
                    <Input
                      label="Follow-up Date (optional)"
                      type="date"
                      value={interaction.followUpDate}
                      onChange={(e) => setInteraction(i => ({ ...i, followUpDate: e.target.value }))}
                    />
                  </div>
                  <Textarea
                    label="Summary *"
                    placeholder="What was discussed? What was the outcome?"
                    rows={3}
                    value={interaction.summary}
                    onChange={(e) => setInteraction(i => ({ ...i, summary: e.target.value }))}
                    className="col-span-2"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" loading={addInteraction.isPending}>Save</Button>
                    <Button size="sm" variant="outline" type="button" onClick={() => setShowInteractionForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              {!ev.interactions?.length ? (
                <p className="text-sm text-gray-500 py-4 text-center">No interactions logged yet</p>
              ) : (
                <div className="space-y-3">
                  {ev.interactions.map((int: any) => (
                    <div key={int.id} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shrink-0">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {int.interactionType.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-gray-500">{int.channel}</span>
                          <span className="text-xs text-gray-400">{formatDate(int.interactedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{int.summary}</p>
                        {int.followUpDate && !int.followUpDone && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⏰ Follow up: {formatDate(int.followUpDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Contact */}
          {(ev.contactPerson || ev.contactEmail || ev.contactPhone) && (
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ev.contactPerson && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{ev.contactPerson}</span>
                  </div>
                )}
                {ev.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${ev.contactEmail}`} className="text-blue-600 hover:underline">
                      {ev.contactEmail}
                    </a>
                  </div>
                )}
                {ev.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{ev.contactPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Rep */}
          {ev.assignedRep && (
            <Card>
              <CardHeader><CardTitle>Assigned To</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {ev.assignedRep.firstName[0]}{ev.assignedRep.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ev.assignedRep.firstName} {ev.assignedRep.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{ev.assignedRep.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registrations */}
          <Card>
            <CardHeader><CardTitle>
              Registrations
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({ev._count?.registrations ?? 0})
              </span>
            </CardTitle></CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => registerMe.mutate({ eventId: ev.id, role: "ATTENDEE" })}
                loading={registerMe.isPending}
              >
                Register as Attendee
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
