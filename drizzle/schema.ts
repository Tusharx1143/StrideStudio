import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Strava Token Storage ───────────────────────────────────────────────
// Stores OAuth tokens per user for Strava API access.
// In production, link this to your user system via the `userId` field.
export const stravaTokens = mysqlTable("strava_tokens", {
  id: int("id").autoincrement().primaryKey(),
  /** Maps to the local user identifier (e.g. openId from auth, or "default" for dev) */
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  /** The Strava athlete ID this token belongs to */
  athleteId: int("athleteId").notNull(),
  /** Strava OAuth2 access token */
  accessToken: text("accessToken").notNull(),
  /** Strava OAuth2 refresh token */
  refreshToken: text("refreshToken").notNull(),
  /** Unix timestamp when the access token expires */
  expiresAt: int("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StravaToken = typeof stravaTokens.$inferSelect;
export type InsertStravaToken = typeof stravaTokens.$inferInsert;

// ─── Cached Strava Activities ───────────────────────────────────────────
// Optional cache for synced activities to reduce Strava API calls.
export const stravaActivities = mysqlTable("strava_activities", {
  id: int("id").autoincrement().primaryKey(),
  /** The Strava activity ID */
  stravaId: bigint("stravaId", { mode: "number" }).notNull().unique(),
  /** The local userId this activity belongs to */
  userId: varchar("userId", { length: 64 }).notNull(),
  /** Activity data serialized as JSON (our Activity type) */
  data: text("data").notNull(),
  /** Raw Strava API response cached for reprocessing */
  raw: text("raw"),
  /** ISO date of the activity start — enables date-based queries */
  startDate: varchar("startDate", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StravaActivity = typeof stravaActivities.$inferSelect;
export type InsertStravaActivity = typeof stravaActivities.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
