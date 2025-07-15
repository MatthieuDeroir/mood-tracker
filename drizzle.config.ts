import { defineConfig } from "npm:drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: Deno.env.get("DATABASE_URL")!,
    },
});
