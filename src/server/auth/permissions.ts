import { UserSystemRole } from "@prisma/client";

export type Permission =
  | "chapters:manage"
  | "chapters:view_all"
  | "chapters:view_own"
  | "ambassadors:manage"
  | "ambassadors:view_all"
  | "ambassadors:view_own_chapter"
  | "activities:approve"
  | "activities:submit"
  | "activities:view_all"
  | "points:configure"
  | "milestones:configure"
  | "certificates:manage"
  | "certificates:verify"
  | "leaderboard:view"
  | "events:manage"
  | "events:create"
  | "media:manage"
  | "community:report"
  | "reports:export_all"
  | "reports:export_own"
  | "audit:view"
  | "settings:manage"
  | "users:manage";

const ROLE_PERMISSIONS: Record<UserSystemRole, Permission[]> = {
  SUPER_ADMIN: [
    "chapters:manage",
    "chapters:view_all",
    "chapters:view_own",
    "ambassadors:manage",
    "ambassadors:view_all",
    "ambassadors:view_own_chapter",
    "activities:approve",
    "activities:submit",
    "activities:view_all",
    "points:configure",
    "milestones:configure",
    "certificates:manage",
    "certificates:verify",
    "leaderboard:view",
    "events:manage",
    "events:create",
    "media:manage",
    "community:report",
    "reports:export_all",
    "reports:export_own",
    "audit:view",
    "settings:manage",
    "users:manage",
  ],
  CAMPUS_LEAD: [
    "chapters:view_own",
    "ambassadors:view_own_chapter",
    "activities:approve",
    "activities:submit",
    "certificates:verify",
    "leaderboard:view",
    "events:create",
    "community:report",
    "reports:export_own",
  ],
  AMBASSADOR: [
    "activities:submit",
    "certificates:verify",
    "leaderboard:view",
  ],
};

export function hasPermission(
  role: UserSystemRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: UserSystemRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
