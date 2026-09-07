/**
 * Domain key type — identifies which brand/site is being served.
 */
export type DomainKey = "PHOTOGRAPHY" | "MEDIA" | "MAIN";

/**
 * Maps incoming hostnames to domain keys.
 * localhost uses NEXT_PUBLIC_DEV_DOMAIN (default: PHOTOGRAPHY).
 */
export function resolveDomainKey(host: string): DomainKey {
  const h = host.split(":")[0].toLowerCase(); // strip port

  if (h === "graywoodphotography.no" || h === "www.graywoodphotography.no") {
    return "PHOTOGRAPHY";
  }
  if (h === "graywoodmedia.no" || h === "www.graywoodmedia.no") {
    return "MEDIA";
  }
  if (h === "graywood.no" || h === "www.graywood.no") {
    return "MAIN";
  }

  // Local dev / unknown — fall back to env or PHOTOGRAPHY
  const devDomain = process.env.NEXT_PUBLIC_DEV_DOMAIN as DomainKey | undefined;
  if (
    devDomain === "PHOTOGRAPHY" ||
    devDomain === "MEDIA" ||
    devDomain === "MAIN"
  ) {
    return devDomain;
  }

  return "PHOTOGRAPHY";
}

/** Per-domain display metadata */
export const DOMAIN_META: Record<
  DomainKey,
  { siteName: string; tagline: string; locale: string }
> = {
  PHOTOGRAPHY: {
    siteName: "Graywood Photography",
    tagline: "Capturing moments, crafting stories.",
    locale: "nb_NO",
  },
  MEDIA: {
    siteName: "Graywood Media",
    tagline: "Creative production for the modern age.",
    locale: "nb_NO",
  },
  MAIN: {
    siteName: "Graywood",
    tagline: "Photography · Media · Creative.",
    locale: "nb_NO",
  },
};

/** The request header name written by proxy.ts and read by layouts. */
export const DOMAIN_HEADER = "x-gw-domain" as const;

/**
 * Server-side helper to read the resolved DomainKey in Server Components.
 */
export async function getDomain(): Promise<DomainKey> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  return (headersList.get(DOMAIN_HEADER) ?? "PHOTOGRAPHY") as DomainKey;
}

