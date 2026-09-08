import { prisma } from "@/lib/prisma";
import type { DomainKey } from "@/lib/domain";

interface ThemeProviderProps {
  domain?: DomainKey;
}

/**
 * Server Component: ThemeProvider
 * Queries BrandSettings for the active domain (or fallback GLOBAL)
 * and injects dynamic CSS custom properties into the document head.
 */
export async function ThemeProvider({ domain }: ThemeProviderProps) {
  let brandSettings = null;

  try {
    if (domain) {
      brandSettings = await prisma.brandSettings.findUnique({
        where: { id: domain },
      });
    }
    if (!brandSettings) {
      brandSettings = await prisma.brandSettings.findUnique({
        where: { id: "GLOBAL" },
      });
    }
  } catch {
    // Graceful fallback during setup or database bootstrap
  }

  const backgroundColor = brandSettings?.backgroundColor || "#F9F8F6";
  const accentColor = brandSettings?.accentColor || "#2D3B36";
  const primaryColor = brandSettings?.primaryColor || "#1C1B19";

  return (
    <style
      id="graywood-dynamic-theme"
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --bg-primary: ${backgroundColor};
            --accent-color: ${accentColor};
            --surface-color: ${primaryColor};
          }
          body {
            background-color: var(--bg-primary);
          }
          .text-accent {
            color: var(--accent-color) !important;
          }
          .bg-accent {
            background-color: var(--accent-color) !important;
          }
          .border-accent {
            border-color: var(--accent-color) !important;
          }
        `,
      }}
    />
  );
}
