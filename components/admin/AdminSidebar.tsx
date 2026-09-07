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
} from "lucide-react";

interface AdminSidebarProps {
  user: AdminUserSession;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
  };

  const isAdmin = user.role === "ADMIN";

  const navItems = [
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
    <aside className="w-full lg:w-72 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col justify-between shrink-0 p-6">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-zinc-800/80 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">
              Graywood Operations
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Command Suite
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">{user.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                isAdmin
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {user.role}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 truncate">
            {user.email}
          </p>
          {!isAdmin && (
            <p className="text-[10px] text-amber-400/80 mt-2 font-mono">
              Restricted clearance: Gear Desk access only
            </p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
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
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition"
        >
          <span className="flex items-center gap-2">
            <span>View Public Platform</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:border-red-800/60 transition cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
