import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, h:mm a");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    CAMPUS_AMBASSADOR: "Campus Ambassador",
    CHAPTER_LEAD_ACHIEVEMENT: "Chapter Lead Achievement",
    NATIONAL_CLOUD_FELLOW: "National Cloud Fellow",
  };
  return labels[tier] ?? tier;
}

export function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    CAMPUS_AMBASSADOR: "bg-blue-100 text-blue-800",
    CHAPTER_LEAD_ACHIEVEMENT: "bg-purple-100 text-purple-800",
    NATIONAL_CLOUD_FELLOW: "bg-amber-100 text-amber-800",
  };
  return colors[tier] ?? "bg-gray-100 text-gray-800";
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    REQUIRES_CORRECTION: "bg-orange-100 text-orange-800",
    DRAFT: "bg-gray-100 text-gray-700",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-700",
    COMPLETED: "bg-green-100 text-green-800",
    CONFIRMED: "bg-green-100 text-green-800",
    DISCOVERED: "bg-gray-100 text-gray-700",
    CONTACTED: "bg-blue-100 text-blue-800",
    PUBLISHED: "bg-purple-100 text-purple-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function initialsFromName(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
