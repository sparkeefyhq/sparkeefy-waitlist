import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/backend/db/schema.ts",
  out: "./src/backend/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
