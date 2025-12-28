import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema";

// Use environment variable if available, otherwise use test/production defaults
const isTest =
  typeof Bun !== "undefined" && Bun.main && Bun.main.includes("test");
const dbPath =
  process.env.DATABASE_URL ||
  process.env.E2E_DATABASE_URL ||
  (isTest ? "comments.test.db" : "comments.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Run migrations for both test and production databases
migrate(db, { migrationsFolder: "./drizzle" });
