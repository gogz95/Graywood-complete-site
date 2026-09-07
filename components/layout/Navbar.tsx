"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDomain } from "@/components/DomainProvider";
import {
  Camera,
  Video,
  Layers,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const domain = useDomain();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setDomainDropdownOpen(false);
  }

  const domainConfig = {
    PHOTOGRAPHY: {
      name: "Graywood Photography",
      shortName: "Photography",
      badge: "Still Studio",
      icon: Camera,
      accentClass: "text-amber-400",
      accentBg: "bg-amber-500",
      accentBorder: "border-amber-500/30",
      links: [
        { label: "Archive", href: "/photography#gallery" },
        { label: "Studio Info", href: "/photography#about" },
        { label: "Book Commission", href: "/photography#contact" },
      ],
    },
    MEDIA: {
      name: "Graywood Media",
      shortName: "Media",
      badge: "Motion Collective",
      icon: Video,
      accentClass: "text-violet-400",
      accentBg: "bg-violet-600",
      accentBorder: "border-violet-500/30",
      links: [
        { label: "Showreel", href: "/media#showreel" },
        { label: "Collective", href: "/media#collective" },
        { label: "Disciplines", href: "/media#capabilities" },
        { label: "Start Project", href: "/photography#contact" },
      ],
    },
    MAIN: {
      name: "Graywood",
      shortName: "Hub",
      badge: "Creative Ecosystem",
      icon: Layers,
      accentClass: "text-blue-400",
      accentBg: "bg-blue-600",
      accentBorder: "border-blue-500/30",
      links: [
        { label: "Photography Studio", href: "/photography" },
        { label: "Media Collective", href: "/media" },
        { label: "Ecosystem Hub", href: "/hub" },
      ],
    },
  }[domain];

  const CurrentIcon = domainConfig.icon;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/85 backdrop-blur-xl border-b border-border/80 shadow-2xl py-3.5"
          : "bg-zinc-950/40 backdrop-blur-md border-b border-border/30 py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-3 transition focus-visible:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-border shadow-inner group-hover:border-accent transition-colors">
              <CurrentIcon className={`h-4.5 w-4.5 ${domainConfig.accentClass}`} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-zinc-200">
                {domainConfig.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                {domainConfig.badge}
              </span>
            </div>
          </Link>

          {/* Domain Switcher Pill */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-2/60 px-3 py-1 text-xs font-mono text-zinc-300 hover:bg-surface-2 hover:text-white transition"
              aria-expanded={domainDropdownOpen}
            >
              <span>Domain: {domainConfig.shortName}</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {domainDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border/90 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  Switch Portal
                </div>
                <Link
                  href="/photography"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition mt-1"
                >
                  <Camera className="h-3.5 w-3.5 text-amber-400" />
                  <span>Graywood Photography</span>
                </Link>
                <Link
                  href="/media"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <Video className="h-3.5 w-3.5 text-violet-400" />
                  <span>Graywood Media</span>
                </Link>
                <Link
                  href="/hub"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  <span>Graywood Hub</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-300">
          {domainConfig.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/photography#contact"
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition shadow-sm ${domainConfig.accentBg} hover:opacity-90`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Inquire</span>
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-border bg-surface-2 p-2 text-zinc-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-zinc-950/98 backdrop-blur-2xl px-6 py-6 animate-fade-in">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Navigation
            </div>
            {domainConfig.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm font-medium text-zinc-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Switch Studio Domain
              </div>
              <Link
                href="/photography"
                className="flex items-center justify-between text-xs py-1.5 text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5 text-amber-400" />
                  Graywood Photography
                </span>
                <ExternalLink className="h-3 w-3 text-zinc-500" />
              </Link>
              <Link
                href="/media"
                className="flex items-center justify-between text-xs py-1.5 text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-violet-400" />
                  Graywood Media
                </span>
                <ExternalLink className="h-3 w-3 text-zinc-500" />
              </Link>
              <Link
                href="/hub"
                className="flex items-center justify-between text-xs py-1.5 text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  Graywood Hub
                </span>
                <ExternalLink className="h-3 w-3 text-zinc-500" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
