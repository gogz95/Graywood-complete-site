import sharp from "sharp";
import fs from "fs";
import path from "path";
import { getNasBasePath } from "../lib/storage";

interface MockImageConfig {
  relPath: string;
  width: number;
  height: number;
  title: string;
  color1: string;
  color2: string;
  cameraMake: string;
  cameraModel: string;
  lensModel: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: number;
}

const mockImages: MockImageConfig[] = [
  {
    relPath: "landscapes/aurora_borealis_tromso.jpg",
    width: 2400,
    height: 1600,
    title: "Aurora Borealis - Tromsø",
    color1: "#0f172a",
    color2: "#10b981",
    cameraMake: "Sony",
    cameraModel: "ILCE-7RM5",
    lensModel: "FE 16-35mm F2.8 GM II",
    focalLength: "16mm",
    aperture: "f/2.8",
    shutterSpeed: "8s",
    iso: 1600,
  },
  {
    relPath: "landscapes/lofoten_peaks_sunset.jpg",
    width: 2000,
    height: 2500,
    title: "Reinebringen Sunset - Lofoten",
    color1: "#1e1b4b",
    color2: "#f97316",
    cameraMake: "Sony",
    cameraModel: "ILCE-7RM4",
    lensModel: "FE 24-70mm F2.8 GM",
    focalLength: "35mm",
    aperture: "f/8.0",
    shutterSpeed: "1/60s",
    iso: 100,
  },
  {
    relPath: "portraits/nordic_studio_portrait.jpg",
    width: 1800,
    height: 2400,
    title: "Nordic Warmth - Studio Portrait",
    color1: "#27272a",
    color2: "#d97706",
    cameraMake: "Canon",
    cameraModel: "EOS R5",
    lensModel: "RF 85mm F1.2 L USM",
    focalLength: "85mm",
    aperture: "f/1.4",
    shutterSpeed: "1/250s",
    iso: 200,
  },
  {
    relPath: "portraits/oslo_street_editorial.jpg",
    width: 2400,
    height: 1600,
    title: "Oslo Opera House - Architectural Editorial",
    color1: "#18181b",
    color2: "#3b82f6",
    cameraMake: "Fujifilm",
    cameraModel: "GFX 100S",
    lensModel: "GF 110mm F2 R LM WR",
    focalLength: "110mm",
    aperture: "f/2.0",
    shutterSpeed: "1/500s",
    iso: 400,
  },
  {
    relPath: "commercial/minimal_audio_hardware.jpg",
    width: 2200,
    height: 1800,
    title: "Minimal Sound Engineering - Commercial Shoot",
    color1: "#09090b",
    color2: "#6366f1",
    cameraMake: "Sony",
    cameraModel: "ILCE-7RM5",
    lensModel: "FE 90mm F2.8 Macro G OSS",
    focalLength: "90mm",
    aperture: "f/5.6",
    shutterSpeed: "1/160s",
    iso: 100,
  },
  {
    relPath: "weddings/geiranger_fjord_couple.jpg",
    width: 2400,
    height: 1600,
    title: "Geiranger Fjord Union",
    color1: "#1e293b",
    color2: "#e0e7ff",
    cameraMake: "Nikon",
    cameraModel: "Z9",
    lensModel: "NIKKOR Z 50mm f/1.2 S",
    focalLength: "50mm",
    aperture: "f/1.8",
    shutterSpeed: "1/1000s",
    iso: 64,
  },
  {
    relPath: "editorial/bergen_rain_mood.jpg",
    width: 1900,
    height: 2400,
    title: "Bryggen Reflections - Bergen",
    color1: "#0f172a",
    color2: "#64748b",
    cameraMake: "Leica",
    cameraModel: "Leica Q3",
    lensModel: "Summilux 28mm f/1.7 ASPH",
    focalLength: "28mm",
    aperture: "f/2.8",
    shutterSpeed: "1/125s",
    iso: 800,
  },
  {
    relPath: "events/underground_techno_oslo.jpg",
    width: 2400,
    height: 1600,
    title: "Subterfuge Club - Oslo Nightlife",
    color1: "#180026",
    color2: "#ec4899",
    cameraMake: "Sony",
    cameraModel: "ILCE-7SIII",
    lensModel: "FE 24mm F1.4 GM",
    focalLength: "24mm",
    aperture: "f/1.4",
    shutterSpeed: "1/100s",
    iso: 6400,
  },
];

async function generateSvgGraphic(cfg: MockImageConfig): Promise<Buffer> {
  const svg = `
    <svg width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${cfg.color1}" />
          <stop offset="100%" stop-color="${cfg.color2}" />
        </linearGradient>
        <radialGradient id="radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <rect width="100%" height="100%" fill="url(#radial)" />

      <!-- Minimal Nordic photographic framing grid -->
      <line x1="${cfg.width * 0.1}" y1="${cfg.height * 0.1}" x2="${cfg.width * 0.9}" y2="${cfg.height * 0.1}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2" />
      <line x1="${cfg.width * 0.1}" y1="${cfg.height * 0.9}" x2="${cfg.width * 0.9}" y2="${cfg.height * 0.9}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2" />
      
      <circle cx="${cfg.width / 2}" cy="${cfg.height / 2}" r="${Math.min(cfg.width, cfg.height) * 0.22}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4" fill="none" />
      <circle cx="${cfg.width / 2}" cy="${cfg.height / 2}" r="${Math.min(cfg.width, cfg.height) * 0.08}" fill="#ffffff" fill-opacity="0.15" />

      <!-- Typography -->
      <text x="${cfg.width / 2}" y="${cfg.height * 0.46}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(cfg.width * 0.032)}" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">
        ${cfg.title.toUpperCase()}
      </text>
      <text x="${cfg.width / 2}" y="${cfg.height * 0.54}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(cfg.width * 0.018)}" font-weight="500" fill="#cbd5e1" text-anchor="middle" letter-spacing="4">
        GRAYWOOD PHOTOGRAPHY ARCHIVE
      </text>
      <text x="${cfg.width / 2}" y="${cfg.height * 0.82}" font-family="monospace" font-size="${Math.round(cfg.width * 0.014)}" fill="#ffffff" fill-opacity="0.75" text-anchor="middle">
        ${cfg.cameraModel} · ${cfg.lensModel} · ${cfg.focalLength} · ${cfg.aperture} · ${cfg.shutterSpeed} · ISO ${cfg.iso}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function main() {
  const nasBase = getNasBasePath();
  console.log(`Setting up mock storage at: ${nasBase}`);

  for (const img of mockImages) {
    const fullPath = path.join(nasBase, img.relPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

    const svgBuffer = await generateSvgGraphic(img);

    // Render JPEG image with genuine dimensions and high quality
    await sharp(svgBuffer)
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .withMetadata({
        exif: {
          IFD0: {
            Make: img.cameraMake,
            Model: img.cameraModel,
            Software: "Graywood Camera Raw 1.0",
          },
        },
      })
      .toFile(fullPath);

    console.log(`  Created: ${img.relPath} (${img.width}x${img.height})`);
  }

  console.log("Mock storage generation complete!");
}

main().catch(console.error);
