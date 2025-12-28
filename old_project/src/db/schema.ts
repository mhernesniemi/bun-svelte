import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
    .$defaultFn(() => new Date()),
});

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
    .$defaultFn(() => new Date()),
});

export const valuationQuestionGroups = sqliteTable(
  "valuation_question_groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

export const valuationQuestions = sqliteTable("valuation_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => valuationQuestionGroups.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
    .$defaultFn(() => new Date()),
});

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
    .$defaultFn(() => new Date()),
});

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
    .$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
  feedbackRequests: many(feedbackRequests, {
    relationName: "userRequests",
  }),
  requestedFeedback: many(feedbackRequests, {
    relationName: "requestedFromUser",
  }),
  feedbackSent: many(feedback, {
    relationName: "sentFeedback",
  }),
  feedbackReceived: many(feedback, {
    relationName: "receivedFeedback",
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const feedbackRequestsRelations = relations(
  feedbackRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [feedbackRequests.userId],
      references: [users.id],
      relationName: "userRequests",
    }),
    requestedUser: one(users, {
      fields: [feedbackRequests.requestedUserId],
      references: [users.id],
      relationName: "requestedFromUser",
    }),
  })
);

export const valuationQuestionGroupsRelations = relations(
  valuationQuestionGroups,
  ({ many }) => ({
    questions: many(valuationQuestions),
    groupAnswers: many(valuationGroupAnswers),
  })
);

export const valuationQuestionsRelations = relations(
  valuationQuestions,
  ({ one, many }) => ({
    group: one(valuationQuestionGroups, {
      fields: [valuationQuestions.groupId],
      references: [valuationQuestionGroups.id],
    }),
    answers: many(valuationAnswers),
  })
);

export const feedbackRelations = relations(feedback, ({ one, many }) => ({
  fromUser: one(users, {
    fields: [feedback.fromUserId],
    references: [users.id],
    relationName: "sentFeedback",
  }),
  toUser: one(users, {
    fields: [feedback.toUserId],
    references: [users.id],
    relationName: "receivedFeedback",
  }),
  answers: many(valuationAnswers),
  groupAnswers: many(valuationGroupAnswers),
}));

export const valuationAnswersRelations = relations(
  valuationAnswers,
  ({ one }) => ({
    feedback: one(feedback, {
      fields: [valuationAnswers.feedbackId],
      references: [feedback.id],
    }),
    question: one(valuationQuestions, {
      fields: [valuationAnswers.questionId],
      references: [valuationQuestions.id],
    }),
  })
);

export const valuationGroupAnswersRelations = relations(
  valuationGroupAnswers,
  ({ one }) => ({
    feedback: one(feedback, {
      fields: [valuationGroupAnswers.feedbackId],
      references: [feedback.id],
    }),
    group: one(valuationQuestionGroups, {
      fields: [valuationGroupAnswers.groupId],
      references: [valuationQuestionGroups.id],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type FeedbackRequest = typeof feedbackRequests.$inferSelect;
export type NewFeedbackRequest = typeof feedbackRequests.$inferInsert;
export type ValuationQuestionGroup =
  typeof valuationQuestionGroups.$inferSelect;
export type NewValuationQuestionGroup =
  typeof valuationQuestionGroups.$inferInsert;
export type ValuationQuestion = typeof valuationQuestions.$inferSelect;
export type NewValuationQuestion = typeof valuationQuestions.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type ValuationAnswer = typeof valuationAnswers.$inferSelect;
export type NewValuationAnswer = typeof valuationAnswers.$inferInsert;
export type ValuationGroupAnswer = typeof valuationGroupAnswers.$inferSelect;
export type NewValuationGroupAnswer = typeof valuationGroupAnswers.$inferInsert;
