"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Building2, ClipboardList, Trophy,
  Calendar, Mic2, MessageSquare, Award, BarChart3, Settings,
  Globe, Bell, LogOut, ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  { label: "Dashboard",     href: "/admin",                   icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
  { label: "Dashboard",     href: "/lead",                    icon: LayoutDashboard, roles: ["CAMPUS_LEAD"] },
  { label: "Dashboard",     href: "/ambassador",              icon: LayoutDashboard, roles: ["AMBASSADOR"] },
  {
    label: "Chapters",      href: "/admin/chapters",          icon: Building2,       roles: ["SUPER_ADMIN"],
    children: [
      { label: "All Chapters",  href: "/admin/chapters" },
      { label: "Institutions",  href: "/admin/chapters/institutions" },
    ],
  },
  { label: "Ambassadors",   href: "/admin/ambassadors",       icon: Users,           roles: ["SUPER_ADMIN"] },
  { label: "Ambassadors",   href: "/lead/ambassadors",        icon: Users,           roles: ["CAMPUS_LEAD"] },
  {
    label: "Activities",    href: "/admin/activities",        icon: ClipboardList,   roles: ["SUPER_ADMIN"],
    children: [
      { label: "Submissions",    href: "/admin/activities" },
      { label: "Activity Types", href: "/admin/activities/types" },
    ],
  },
  { label: "Activities",    href: "/lead/activities",         icon: ClipboardList,   roles: ["CAMPUS_LEAD"] },
  { label: "My Activities", href: "/ambassador/activities",   icon: ClipboardList,   roles: ["AMBASSADOR"] },
  { label: "Events",        href: "/admin/events",            icon: Calendar,        roles: ["SUPER_ADMIN"] },
  { label: "Events",        href: "/lead/events",             icon: Calendar,        roles: ["CAMPUS_LEAD"] },
  {
    label: "Media",         href: "/admin/media",             icon: Mic2,            roles: ["SUPER_ADMIN"],
    children: [
      { label: "Dashboard",      href: "/admin/media" },
      { label: "Organisations",  href: "/admin/media/organisations" },
      { label: "Opportunities",  href: "/admin/media/opportunities" },
      { label: "Follow-ups",     href: "/admin/media/followups" },
    ],
  },
  { label: "Community",     href: "/admin/community",         icon: MessageSquare,   roles: ["SUPER_ADMIN"] },
  { label: "Community",     href: "/lead/community",          icon: MessageSquare,   roles: ["CAMPUS_LEAD"] },
  { label: "Leaderboards",  href: "/admin/leaderboards",      icon: Trophy,          roles: ["SUPER_ADMIN"] },
  { label: "Leaderboards",  href: "/ambassador/leaderboards", icon: Trophy,          roles: ["AMBASSADOR", "CAMPUS_LEAD"] },
  { label: "Certificates",  href: "/admin/certificates",      icon: Award,           roles: ["SUPER_ADMIN"] },
  { label: "Certificates",  href: "/ambassador/certificates", icon: Award,           roles: ["AMBASSADOR"] },
  { label: "Reports",       href: "/admin/reports",           icon: BarChart3,       roles: ["SUPER_ADMIN", "CAMPUS_LEAD"] },
  { label: "Settings",      href: "/admin/settings",          icon: Settings,        roles: ["SUPER_ADMIN"] },
];

// Design tokens — sidebar colours on #091F53
const SB = {
  bg:           "#091F53",
  hover:        "rgba(255,255,255,0.07)",
  active:       "rgba(255,255,255,0.14)",
  activeBorder: "rgba(255,255,255,0.35)",
  text:         "rgba(255,255,255,0.55)",
  textActive:   "#ffffff",
  divider:      "rgba(255,255,255,0.08)",
};

interface Props { userRole: string; userName: string; userEmail: string }

export function Sidebar({ userRole, userName, userEmail }: Props) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["/admin/chapters", "/admin/activities", "/admin/media"]);

  const items = NAV.filter(n => n.roles.includes(userRole));
  const initials = userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const isActive = (href: string) =>
    pathname === href || (href.length > 10 && pathname.startsWith(href));

  const toggleGroup = (href: string) =>
    setOpenGroups(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]);

  return (
    <aside style={{
      /* Floating sidebar — does not touch edges */
      position: "fixed",
      left: "10px",
      top: "10px",
      bottom: "10px",
      width: "calc(var(--sidebar-w) - 10px)",  /* 190px */

      background: SB.bg,
      borderRadius: "14px",
      boxShadow: "0 8px 32px rgba(9,31,83,0.45), 0 2px 8px rgba(9,31,83,0.3)",
      border: "1px solid rgba(255,255,255,0.06)",

      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      overflow: "hidden",
    }}>

      {/* Brand */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${SB.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Globe style={{ width: "15px", height: "15px", color: "#fff" }} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Campus Builders</p>
            <p style={{ fontSize: "10px", color: SB.text, lineHeight: 1.2 }}>Truehost Cloud</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px" }}>
        {items.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isOpen = openGroups.includes(item.href);
          const anyChildActive = item.children?.some(c => isActive(c.href)) ?? false;

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleGroup(item.href)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "8px",
                    padding: "7px 8px", borderRadius: "8px", border: "none",
                    background: anyChildActive ? SB.active : "transparent",
                    cursor: "pointer", marginBottom: "1px",
                    color: anyChildActive ? SB.textActive : SB.text,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!anyChildActive) { (e.currentTarget as HTMLElement).style.background = SB.hover; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; } }}
                  onMouseLeave={(e) => { if (!anyChildActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.text; } }}
                >
                  <Icon style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "12.5px", fontWeight: 500, textAlign: "left" }}>{item.label}</span>
                  <ChevronDown style={{ width: "11px", height: "11px", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", opacity: 0.5 }} />
                </button>
                {isOpen && (
                  <div style={{ marginLeft: "23px", marginBottom: "4px", borderLeft: `1px solid ${SB.divider}`, paddingLeft: "10px" }}>
                    {item.children.map(child => {
                      const childActive = isActive(child.href);
                      return (
                        <Link key={child.href} href={child.href} style={{ textDecoration: "none" }}>
                          <div style={{
                            padding: "5px 8px", borderRadius: "6px", fontSize: "12px",
                            color: childActive ? "#fff" : SB.text,
                            fontWeight: childActive ? 600 : 400,
                            background: childActive ? SB.active : "transparent",
                            cursor: "pointer", marginBottom: "1px",
                            transition: "background 0.15s, color 0.15s",
                          }}
                            onMouseEnter={(e) => { if (!childActive) { (e.currentTarget as HTMLElement).style.background = SB.hover; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; } }}
                            onMouseLeave={(e) => { if (!childActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.text; } }}
                          >
                            {child.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 8px", borderRadius: "8px", cursor: "pointer",
                  marginBottom: "1px",
                  background: active ? SB.active : "transparent",
                  color: active ? SB.textActive : SB.text,
                  borderLeft: active ? `3px solid ${SB.activeBorder}` : "3px solid transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = SB.hover; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.text; } }}
              >
                <Icon style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                <span style={{ fontSize: "12.5px", fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: `1px solid ${SB.divider}`, padding: "6px 8px" }}>
        <Link href="/notifications" style={{ textDecoration: "none" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "8px", cursor: "pointer", color: SB.text, marginBottom: "2px", transition: "background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.hover; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.text; }}
          >
            <Bell style={{ width: "15px", height: "15px" }} />
            <span style={{ fontSize: "12.5px" }}>Notifications</span>
          </div>
        </Link>
      </div>

      {/* User row */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${SB.divider}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
          <p style={{ fontSize: "9.5px", color: SB.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          style={{ background: "none", border: "none", cursor: "pointer", color: SB.text, padding: "2px", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = SB.text)}
        >
          <LogOut style={{ width: "13px", height: "13px" }} />
        </button>
      </div>
    </aside>
  );
}
