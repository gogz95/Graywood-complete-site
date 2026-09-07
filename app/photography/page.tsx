import { prisma } from "@/lib/prisma";
import { PhotographyGallery } from "@/components/photography/PhotographyGallery";
import { ContactForm } from "@/components/photography/ContactForm";
import { Camera, Compass, Award, ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PhotographyPage() {
  const rawAssets = await prisma.mediaAsset.findMany({
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
      <section className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center border-b border-border overflow-hidden">
        {/* Ambient atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted">
            <Camera className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono uppercase tracking-widest text-zinc-300">
              Graywood Photography Studio
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Visual narratives across the Nordic landscape.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Specialized in commercial campaigns, architectural documentation, and editorial storytelling. Captured with medium-format precision and authentic atmospheric light.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover shadow-lg shadow-accent/20"
            >
              Explore Archive
              <ArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-2"
            >
              Initiate Commission
            </a>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-border/60 pt-8 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-2 p-2 border border-border">
              <Camera className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Medium Format Rig</p>
              <p className="text-xs text-muted">Ultra high-fidelity sensor captures up to 100 megapixels.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-2 p-2 border border-border">
              <Compass className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Extreme Locations</p>
              <p className="text-xs text-muted">Fjord, sub-zero Arctic, and architectural remote access.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-2 p-2 border border-border">
              <Award className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Color Grading Mastery</p>
              <p className="text-xs text-muted">Bespoke LUTs tailored for editorial print and high-res web.</p>
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
