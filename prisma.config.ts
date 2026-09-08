import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const rawUrl = env("DATABASE_URL");
const dbUrl = rawUrl && rawUrl.startsWith("file:.") && !rawUrl.includes("prisma")
  ? rawUrl.replace("file:.", "file:./prisma")
  : rawUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
});
