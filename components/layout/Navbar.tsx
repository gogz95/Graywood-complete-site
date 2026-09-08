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

  // Determine active domain, allowing pathname to override for unified local/preview browsing
  let activeDomain = domain;
  if (pathname.startsWith("/media")) {
    activeDomain = "MEDIA";
  } else if (pathname.startsWith("/hub")) {
    activeDomain = "MAIN";
  } else if (pathname.startsWith("/photography")) {
    activeDomain = "PHOTOGRAPHY";
  }

  const domainConfig = {
    PHOTOGRAPHY: {
      name: "Graywood Photography",
      shortName: "Photography",
      badge: "Still Studio",
      icon: Camera,
      accentClass: "text-nordic-pine",
      accentBg: "bg-nordic-pine",
      accentBorder: "border-nordic-pine/30",
      homeHref: "/photography",
      inquireHref: "/photography#contact",
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
      accentClass: "text-nordic-clay",
      accentBg: "bg-nordic-clay",
      accentBorder: "border-nordic-clay/30",
      homeHref: "/media",
      inquireHref: "/media#contact",
      links: [
        { label: "Showreel", href: "/media#showreel" },
        { label: "Services", href: "/media#services" },
        { label: "Portfolios", href: "/media#portfolios" },
        { label: "Contact", href: "/media#contact" },
      ],
    },
    MAIN: {
      name: "Graywood Studio",
      shortName: "Hub",
      badge: "Ecosystem Hub",
      icon: Layers,
      accentClass: "text-nordic-pine",
      accentBg: "bg-nordic-pine",
      accentBorder: "border-nordic-pine/30",
      homeHref: "/hub",
      inquireHref: "/photography#contact",
      links: [
        { label: "Photography Studio", href: "/photography" },
        { label: "Media Collective", href: "/media" },
        { label: "Ecosystem Hub", href: "/hub" },
      ],
    },
  }[activeDomain] || {
    name: "Graywood Studio",
    shortName: "Hub",
    badge: "Ecosystem Hub",
    icon: Layers,
    accentClass: "text-nordic-pine",
    accentBg: "bg-nordic-pine",
    accentBorder: "border-nordic-pine/30",
    homeHref: "/hub",
    inquireHref: "/photography#contact",
    links: [
      { label: "Photography Studio", href: "/photography" },
      { label: "Media Collective", href: "/media" },
      { label: "Ecosystem Hub", href: "/hub" },
    ],
  };

  const CurrentIcon = domainConfig.icon;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-nordic-surface/90 backdrop-blur-xl border-b border-nordic-border shadow-xs py-3.5"
          : "bg-nordic-canvas/80 backdrop-blur-md border-b border-nordic-border/60 py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href={domainConfig.homeHref}
            className="group flex items-center gap-3 transition focus-visible:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nordic-surface border border-nordic-border shadow-xs group-hover:border-nordic-divider transition-colors">
              <CurrentIcon className={`h-4.5 w-4.5 ${domainConfig.accentClass}`} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-nordic-ink transition-colors">
                {domainConfig.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-nordic-subtle">
                {domainConfig.badge}
              </span>
            </div>
          </Link>

          {/* Domain Switcher Pill */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full border border-nordic-border bg-nordic-surface px-3 py-1 text-xs font-mono text-nordic-subtle hover:text-nordic-ink hover:border-nordic-divider transition cursor-pointer"
              aria-expanded={domainDropdownOpen}
            >
              <span>Domain: {domainConfig.shortName}</span>
              <ChevronDown className="h-3 w-3 text-nordic-faint" />
            </button>

            {domainDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-nordic-border bg-nordic-surface p-2 shadow-xl backdrop-blur-xl animate-fade-in z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-nordic-faint border-b border-nordic-border">
                  Switch Portal
                </div>
                <Link
                  href="/photography"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition mt-1 ${
                    activeDomain === "PHOTOGRAPHY"
                      ? "bg-nordic-muted font-medium text-nordic-ink"
                      : "text-nordic-subtle hover:bg-nordic-muted hover:text-nordic-ink"
                  }`}
                >
                  <Camera className="h-3.5 w-3.5 text-nordic-pine" />
                  <span>Graywood Photography</span>
                </Link>
                <Link
                  href="/media"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition ${
                    activeDomain === "MEDIA"
                      ? "bg-nordic-muted font-medium text-nordic-ink"
                      : "text-nordic-subtle hover:bg-nordic-muted hover:text-nordic-ink"
                  }`}
                >
                  <Video className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Graywood Media</span>
                </Link>
                <Link
                  href="/hub"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition ${
                    activeDomain === "MAIN"
                      ? "bg-nordic-muted font-medium text-nordic-ink"
                      : "text-nordic-subtle hover:bg-nordic-muted hover:text-nordic-ink"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-nordic-pine" />
                  <span>Graywood Hub</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-nordic-subtle">
          {domainConfig.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-nordic-ink transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={domainConfig.inquireHref}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition shadow-xs ${domainConfig.accentBg} hover:opacity-90`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Inquire</span>
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-nordic-border bg-nordic-surface p-2 text-nordic-subtle hover:text-nordic-ink transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-nordic-border bg-nordic-surface/98 backdrop-blur-2xl px-6 py-6 animate-fade-in">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-nordic-faint">
              Navigation
            </div>
            {domainConfig.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm font-medium text-nordic-subtle hover:text-nordic-ink"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-nordic-border space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-nordic-faint">
                Switch Studio Domain
              </div>
              <Link
                href="/photography"
                className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition ${
                  activeDomain === "PHOTOGRAPHY"
                    ? "bg-nordic-muted font-medium text-nordic-ink"
                    : "text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5 text-nordic-pine" />
                  Graywood Photography
                </span>
                <ExternalLink className="h-3 w-3 text-nordic-faint" />
              </Link>
              <Link
                href="/media"
                className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition ${
                  activeDomain === "MEDIA"
                    ? "bg-nordic-muted font-medium text-nordic-ink"
                    : "text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-nordic-clay" />
                  Graywood Media
                </span>
                <ExternalLink className="h-3 w-3 text-nordic-faint" />
              </Link>
              <Link
                href="/hub"
                className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition ${
                  activeDomain === "MAIN"
                    ? "bg-nordic-muted font-medium text-nordic-ink"
                    : "text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-nordic-pine" />
                  Graywood Hub
                </span>
                <ExternalLink className="h-3 w-3 text-nordic-faint" />
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href={domainConfig.inquireHref}
                className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-xs font-medium text-white shadow-xs ${domainConfig.accentBg} hover:opacity-90 transition`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Inquire with Studio</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
