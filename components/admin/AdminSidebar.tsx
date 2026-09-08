"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/app/actions/admin";
import type { AdminUserSession } from "@/lib/admin-session";
import {
  LayoutDashboard,
  Briefcase,
  Images,
  BookOpen,
  Sliders,
  LogOut,
  Shield,
  ExternalLink,
  ChevronRight,
  Inbox,
} from "lucide-react";

interface AdminSidebarProps {
  user: AdminUserSession;
  newInquiriesCount?: number;
}

export function AdminSidebar({ user, newInquiriesCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
  };

  const isAdmin = user.role === "ADMIN";

  const navItems: { label: string; href: string; icon: React.ElementType; adminOnly: boolean; badge?: number }[] = [
    {
      label: "Operations Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      label: "Gated Gear Desk",
      href: "/admin/gear",
      icon: Briefcase,
      adminOnly: false,
    },
    {
      label: "Virtual Library",
      href: "/admin/library",
      icon: Images,
      adminOnly: true,
    },
    {
      label: "Client Inquiries",
      href: "/admin/inquiries",
      icon: Inbox,
      adminOnly: true,
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
    },
    {
      label: "Manga Suite",
      href: "/admin/manga",
      icon: BookOpen,
      adminOnly: true,
    },
    {
      label: "System Customizer",
      href: "/admin/customizer",
      icon: Sliders,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => isAdmin || !item.adminOnly);

  return (
    <aside className="w-full lg:w-72 bg-nordic-surface border-b lg:border-b-0 lg:border-r border-nordic-border flex flex-col justify-between shrink-0 p-6">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-nordic-border mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nordic-muted border border-nordic-border text-nordic-pine">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base font-medium text-nordic-ink tracking-tight">
              Graywood Operations
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-nordic-faint">
              Command Suite
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="rounded-2xl border border-nordic-border bg-nordic-muted/60 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-nordic-ink">{user.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                isAdmin
                  ? "bg-nordic-surface text-nordic-pine border border-nordic-border"
                  : "bg-nordic-surface text-nordic-clay border border-nordic-border"
              }`}
            >
              {user.role}
            </span>
          </div>
          <p className="text-[11px] font-mono text-nordic-subtle truncate">
            {user.email}
          </p>
          {!isAdmin && (
            <p className="text-[10px] text-nordic-clay mt-2 font-mono">
              Restricted clearance: Gear Desk access only
            </p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-nordic-faint px-3 py-1">
            Modules
          </div>
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-nordic-pine text-white shadow-xs font-medium"
                    : "text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold font-mono leading-none ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#EAF3EE] text-[#2D5A3D] border border-[#C5DFD0]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-6 border-t border-nordic-border mt-6 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted transition"
        >
          <span className="flex items-center gap-2">
            <span>View Public Platform</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-nordic-faint" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-nordic-border bg-nordic-muted/40 px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-clay hover:border-nordic-clay/30 hover:bg-[#FDF3EE] transition cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
