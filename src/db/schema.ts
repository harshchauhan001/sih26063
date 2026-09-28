import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", ["researcher", "content_manager", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
]);
export const regionEnum = pgEnum("region", [
  "arctic",
  "antarctic",
  "himalaya",
  "southern_ocean",
  "other",
]);
export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);
export const accessLevelEnum = pgEnum("access_level", ["public", "restricted", "internal"]);
export const educationTypeEnum = pgEnum("education_type", [
  "article",
  "module",
  "glossary",
  "quiz",
]);
export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced"]);

// ---------- Users & Auth ----------
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("researcher"),
    organization: varchar("organization", { length: 255 }),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Expeditions ----------
export const expeditions = pgTable("expeditions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  expeditionNumber: varchar("expedition_number", { length: 100 }),
  year: integer("year").notNull(),
  region: regionEnum("region").notNull().default("antarctic"),
  location: varchar("location", { length: 255 }),
  objectives: text("objectives"),
  description: text("description"),
  organizations: text("organizations").array(),
  scientists: text("scientists").array(),
  reportUrl: text("report_url"),
  coverImageUrl: text("cover_image_url"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Publications ----------
export const publications = pgTable("publications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  abstract: text("abstract"),
  authors: text("authors").array(),
  year: integer("year").notNull(),
  researchArea: varchar("research_area", { length: 150 }),
  keywords: text("keywords").array(),
  organization: varchar("organization", { length: 255 }),
  doi: varchar("doi", { length: 150 }),
  fileUrl: text("file_url"),
  expeditionId: integer("expedition_id").references(() => expeditions.id),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Datasets ----------
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  provider: varchar("provider", { length: 255 }),
  researchArea: varchar("research_area", { length: 150 }),
  region: regionEnum("region").notNull().default("antarctic"),
  collectionPeriod: varchar("collection_period", { length: 150 }),
  format: varchar("format", { length: 50 }),
  size: varchar("size", { length: 50 }),
  version: varchar("version", { length: 30 }),
  metadata: text("metadata"),
  fileUrl: text("file_url"),
  accessLevel: accessLevelEnum("access_level").notNull().default("public"),
  expeditionId: integer("expedition_id").references(() => expeditions.id),
  publicationId: integer("publication_id").references(() => publications.id),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Media ----------
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  mediaType: mediaTypeEnum("media_type").notNull().default("photo"),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: varchar("category", { length: 100 }),
  expeditionId: integer("expedition_id").references(() => expeditions.id),
  location: varchar("location", { length: 255 }),
  capturedOn: varchar("captured_on", { length: 50 }),
  credits: varchar("credits", { length: 255 }),
  accessLevel: accessLevelEnum("access_level").notNull().default("public"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Education ----------
export const educationalContent = pgTable("educational_content", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: educationTypeEnum("type").notNull().default("article"),
  summary: text("summary"),
  content: text("content"),
  difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
  tags: text("tags").array(),
  quizData: jsonb("quiz_data"),
  coverImageUrl: text("cover_image_url"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- AI Content Generation ----------
export const aiJobs = pgTable("ai_jobs", {
  id: serial("id").primaryKey(),
  sourceTitle: varchar("source_title", { length: 255 }),
  sourceText: text("source_text"),
  sourceFileName: varchar("source_file_name", { length: 255 }),
  requestedOutputs: text("requested_outputs").array(),
  model: varchar("model", { length: 100 }),
  generatedTitle: varchar("generated_title", { length: 255 }),
  summary: text("summary"),
  keyPoints: text("key_points").array(),
  keywords: text("keywords").array(),
  article: text("article"),
  educationalExplanation: text("educational_explanation"),
  socialPost: text("social_post"),
  suggestedTags: text("suggested_tags").array(),
  suggestedCategory: varchar("suggested_category", { length: 150 }),
  createdBy: integer("created_by").references(() => users.id),
  status: contentStatusEnum("status").notNull().default("draft"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  publishedContentId: integer("published_content_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Notifications ----------
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  link: varchar("link", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Audit Log ----------
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 150 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
