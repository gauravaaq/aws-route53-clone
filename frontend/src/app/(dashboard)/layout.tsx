"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TopNav } from "@/components/ui/TopNav";
import { Sidebar } from "@/components/ui/Sidebar";

import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Focus search input: Cmd+K / Ctrl+K or / (when not typing)
      const isTyping = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !isTyping)) {
        e.preventDefault();
        const searchBox = document.querySelector(".search-input, .search-input-dns") as HTMLInputElement | null;
        if (searchBox) {
          searchBox.focus();
          searchBox.select();
        }
      }

      // 2. Create Modal shortcut: Shift+C (when not typing)
      if (e.key === "C" && e.shiftKey && !isTyping) {
        e.preventDefault();
        // Finds the primary CTA button (Create Hosted Zone / Create Record)
        const ctaButton = document.querySelector(".btn-primary") as HTMLButtonElement | null;
        if (ctaButton) {
          ctaButton.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AuthGuard>
      <div className="dashboard-layout">
        <TopNav />
        <div className="layout-body">
          <Sidebar />
          <main className="main-content-panel">
            {children}
          </main>
        </div>
      </div>
      <style jsx>{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .layout-body {
          display: flex;
          flex: 1;
          height: calc(100vh - 48px);
          overflow: hidden;
        }
        .main-content-panel {
          flex: 1;
          overflow-y: auto;
          background-color: var(--aws-bg-body);
        }
      `}</style>
    </AuthGuard>
  );
}
