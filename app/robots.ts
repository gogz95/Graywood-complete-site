import type { MetadataRoute } from "next";

/**
 * app/robots.ts — Search engine crawler instructions.
 *
 * Implements Zero-Discovery Privacy & Crawler Lockout for client proofing portals.
 * Strictly disallows indexing of private proofing portals and download endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://graywoodphotography.no";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/photography", "/media", "/hub"],
        disallow: [
          "/portal/",
          "/api/portal/",
          "/admin/",
          "/api/admin/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
