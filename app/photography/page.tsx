import { prisma } from "@/lib/prisma";
import { getSiteContent, getStudioFeatures } from "@/lib/content";
import { PhotographyGallery } from "@/components/photography/PhotographyGallery";
import { ContactForm } from "@/components/photography/ContactForm";
import { Camera, Compass, Award, Aperture, ArrowDown, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  Compass,
  Award,
  Aperture,
  Sparkles,
};

export default async function PhotographyPage() {
  const [content, features, rawAssets] = await Promise.all([
    getSiteContent("PHOTOGRAPHY"),
    getStudioFeatures("PHOTOGRAPHY"),
    prisma.mediaAsset.findMany({
      where: {
        isPublic: true,
        albumItems: {
          none: {
            album: {
              type: "CLIENT_PROOFING",
            },
          },
        },
      },
      orderBy: { indexedAt: "desc" },
    }),
  ]);

  const assets = rawAssets.map((a) => ({
    id: a.id,
    filePath: a.originalPath,
    fileName: a.filename,
    width: a.width,
    height: a.height,
    cameraModel: a.cameraModel,
    lensModel: a.lensModel,
    focalLength: a.focalLength,
    aperture: a.aperture,
    shutterSpeed: a.shutterSpeed,
    iso: a.iso,
    capturedAt: a.capturedAt ? a.capturedAt.toISOString() : null,
  }));

  const heroBadge = content["HERO.badge"] || "";
  const heroTitle = content["HERO.title"] || "";
  const heroDescription = content["HERO.description"] || "";

  const archiveTitle = content["ARCHIVE.title"] || "";
  const archiveDescription = content["ARCHIVE.description"] || "";

  const commissionTitle = content["COMMISSION.title"] || "";
  const commissionDescription = content["COMMISSION.description"] || "";

  return (
    <main className="w-full min-h-screen bg-nordic-canvas text-nordic-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col space-y-20">
        {/* Editorial Hero */}
        <section className="relative w-full py-20 px-6 sm:px-10 flex flex-col items-center justify-center text-center rounded-3xl border border-nordic-border bg-nordic-surface/60 overflow-hidden">
          {/* Subtle ambient atmospheric tone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-nordic-pine/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            {heroBadge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-nordic-border bg-nordic-surface px-4 py-1.5 text-xs text-nordic-subtle">
                <Camera className="h-3.5 w-3.5 text-nordic-pine" />
                <span className="font-mono uppercase tracking-widest text-nordic-subtle">
                  {heroBadge}
                </span>
              </div>
            )}

            {heroTitle && (
              <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-nordic-ink leading-[1.1]">
                {heroTitle}
              </h1>
            )}

            {heroDescription && (
              <p className="text-base sm:text-lg text-nordic-subtle max-w-2xl mx-auto leading-relaxed">
                {heroDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-3 text-sm font-medium text-white transition hover:bg-nordic-pine/90 shadow-sm cursor-pointer"
              >
                Explore Archive
                <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-6 py-3 text-sm font-medium text-nordic-ink transition hover:bg-nordic-muted cursor-pointer"
              >
                Initiate Commission
              </a>
            </div>
          </div>

          {/* Dynamic Feature Highlights Banner (If features.length === 0, render nothing) */}
          {features.length > 0 && (
            <div className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-nordic-border pt-8 text-left">
              {features.map((feature) => {
                const IconComp = FEATURE_ICONS[feature.icon] || Camera;
                return (
                  <div key={feature.id} className="flex items-start gap-3">
                    <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border text-nordic-pine shrink-0">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-nordic-ink">{feature.title}</p>
                      <p className="text-xs text-nordic-subtle leading-relaxed mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Gallery Section with Masonry & Lightbox */}
        <div id="gallery">
          <PhotographyGallery
            assets={assets}
            title={archiveTitle}
            description={archiveDescription}
          />
        </div>

        {/* Contact Section */}
        <ContactForm
          title={commissionTitle}
          description={commissionDescription}
        />
      </div>
    </main>
  );
}
