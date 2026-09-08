import { prisma } from "@/lib/prisma";
import { PhotographyGallery } from "@/components/photography/PhotographyGallery";
import { ContactForm } from "@/components/photography/ContactForm";
import { Camera, Compass, Award, ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PhotographyPage() {
  const rawAssets = await prisma.mediaAsset.findMany({
    where: {
      albums: {
        none: {
          album: {
            type: "CLIENT_PROOFING",
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const assets = rawAssets.map((a: {
    id: string;
    filePath: string;
    fileName: string;
    width: number | null;
    height: number | null;
    cameraModel: string | null;
    lensModel: string | null;
    focalLength: string | null;
    aperture: string | null;
    shutterSpeed: string | null;
    iso: number | null;
    capturedAt: Date | null;
  }) => ({
    id: a.id,
    filePath: a.filePath,
    fileName: a.fileName,
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Editorial Hero */}
      <section className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center border-b border-nordic-border overflow-hidden">
        {/* Subtle ambient atmospheric tone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-nordic-pine/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-nordic-border bg-nordic-surface px-4 py-1.5 text-xs text-nordic-subtle">
            <Camera className="h-3.5 w-3.5 text-nordic-pine" />
            <span className="font-mono uppercase tracking-widest text-nordic-subtle">
              Graywood Photography Studio
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-nordic-ink leading-[1.1]">
            Visual narratives across the Nordic landscape.
          </h1>

          <p className="text-base sm:text-lg text-nordic-subtle max-w-2xl mx-auto leading-relaxed">
            Specialized in commercial campaigns, architectural documentation, and editorial storytelling. Captured with medium-format precision and authentic atmospheric light.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-3 text-sm font-medium text-white transition hover:bg-nordic-pine/90 shadow-sm"
            >
              Explore Archive
              <ArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-6 py-3 text-sm font-medium text-nordic-ink transition hover:bg-nordic-muted"
            >
              Initiate Commission
            </a>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-nordic-border pt-8 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border">
              <Camera className="h-4 w-4 text-nordic-pine" />
            </div>
            <div>
              <p className="text-xs font-semibold text-nordic-ink">Medium Format Rig</p>
              <p className="text-xs text-nordic-subtle">Ultra high-fidelity sensor captures up to 100 megapixels.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border">
              <Compass className="h-4 w-4 text-nordic-pine" />
            </div>
            <div>
              <p className="text-xs font-semibold text-nordic-ink">Extreme Locations</p>
              <p className="text-xs text-nordic-subtle">Fjord, sub-zero Arctic, and architectural remote access.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border">
              <Award className="h-4 w-4 text-nordic-pine" />
            </div>
            <div>
              <p className="text-xs font-semibold text-nordic-ink">Color Grading Mastery</p>
              <p className="text-xs text-nordic-subtle">Bespoke LUTs tailored for editorial print and high-res web.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section with Masonry & Lightbox */}
      <div id="gallery">
        <PhotographyGallery assets={assets} />
      </div>

      {/* Contact Section */}
      <ContactForm />
    </div>
  );
}
