import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  channelId: text("channel_id"),
  channelName: text("channel_name"),
  title: text("title"),
  lang: text("lang"),
  hasStandardCaption: boolean("has_standard_caption").notNull().default(false),
  indexedAt: timestamp("indexed_at").notNull().defaultNow(),
});

export const clips = pgTable("clips", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id),
  startSec: real("start_sec").notNull(),
  endSec: real("end_sec").notNull(),
  transcript: text("transcript").notNull(),
  wordsPerSec: real("words_per_sec"),
  tags: text("tags").array().notNull().default([]),
  estDifficulty: real("est_difficulty"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clipId: uuid("clip_id")
    .notNull()
    .references(() => clips.id),
  deviceId: text("device_id").notNull(),
  typedText: text("typed_text").notNull(),
  score: integer("score").notNull(),
  verdict: text("verdict").notNull(),
  aiFeedback: jsonb("ai_feedback"),
  matchedByFastPath: boolean("matched_by_fast_path").notNull().default(false),
  replayCount: integer("replay_count").notNull().default(0),
  msToAnswer: integer("ms_to_answer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Clip = typeof clips.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Video = typeof videos.$inferSelect;
