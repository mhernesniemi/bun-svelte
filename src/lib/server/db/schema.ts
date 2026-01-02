import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Users
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Comments
 */
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  author: text("author").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Feedback requests
 */
export const feedbackRequests = sqliteTable("feedback_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  requestedUserId: integer("requested_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Valuation question groups
 */
export const valuationQuestionGroups = sqliteTable("valuation_question_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Valuation questions
 */
export const valuationQuestions = sqliteTable("valuation_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => valuationQuestionGroups.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  order: integer("order").notNull().default(0),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Feedback
 */
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: integer("to_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Feedback drafts
 */
export const feedbackDrafts = sqliteTable("feedback_drafts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id")
    .notNull()
    .references(() => users.id),
  groups: text("groups").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Valuation answers
 */
export const valuationAnswers = sqliteTable("valuation_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => valuationQuestions.id),
  rating: integer("rating").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

/**
 * Valuation group answers
 */
export const valuationGroupAnswers = sqliteTable("valuation_group_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  groupId: integer("group_id")
    .notNull()
    .references(() => valuationQuestionGroups.id),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
