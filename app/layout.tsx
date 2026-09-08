import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { type DomainKey, DOMAIN_HEADER, DOMAIN_META } from "@/lib/domain";
import { DomainProvider } from "@/components/DomainProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { checkSetupStatus } from "@/lib/setup";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Dynamic metadata — title and description reflect the active domain.
 * This runs per-request (dynamic rendering) because it reads headers().
 */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const domain = (headersList.get(DOMAIN_HEADER) ?? "PHOTOGRAPHY") as DomainKey;
  const meta = DOMAIN_META[domain];

  return {
    title: {
      default: meta.siteName,
      template: `%s | ${meta.siteName}`,
    },
    description: meta.tagline,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    openGraph: {
      siteName: meta.siteName,
      locale: meta.locale,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const domain = (headersList.get(DOMAIN_HEADER) ?? "PHOTOGRAPHY") as DomainKey;
  const pathname = headersList.get("x-pathname") ?? "";

  // Verify setup status; if incomplete and not on /setup, enforce setup redirection
  const isSetupComplete = await checkSetupStatus();
  const isSetupRoute = pathname.startsWith("/setup");

  if (!isSetupComplete && !isSetupRoute && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    redirect("/setup");
  }

  return (
    <html
      lang="no"
      data-domain={domain}
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="bg-[#F9F8F6] text-[#1C1B19] min-h-screen flex flex-col font-sans">
        <ThemeProvider domain={domain} />
        {isSetupRoute ? (
          <main className="flex-1 flex flex-col">{children}</main>
        ) : (
          <DomainProvider domain={domain}>
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </DomainProvider>
        )}
      </body>
    </html>
  );
}

