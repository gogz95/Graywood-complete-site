import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma v7 configuration file.
 *
 * The datasource URL is now declared here instead of in schema.prisma.
 * See: https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
