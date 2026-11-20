"use client";

import { Sidebar } from "./sidebar";

interface Props {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  userEmail: string;
}

export function DashboardShell({ children, userRole, userName, userEmail }: Props) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />
      {/*
        Sidebar is fixed, left: 10px, width: 190px.
        Give main content a left margin of 210px (190 + 10 gap + 10 right breathing room).
      */}
      <main
        style={{
          marginLeft: "210px",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
