import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/mood-tracker-dev",
});

export const db = drizzle(pool, { schema });

// Run migrations
export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("✅ Database migrations completed!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
}

export async function testConnection() {
  try {
    // Test basic database connection
    const result = await db.execute("SELECT 1");
    console.log("✅ Database connection successful!");
    return result;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function closeConnection() {
  await pool.end();
  console.log("✅ Database connection closed!");
}