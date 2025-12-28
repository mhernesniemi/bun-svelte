import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import {
  comments,
  users,
  feedbackRequests,
  feedback,
  valuationQuestionGroups,
  valuationQuestions,
  valuationAnswers,
  valuationGroupAnswers,
} from "./db/schema";
import type { ValuationQuestionGroup, ValuationQuestion } from "./db/schema";
import { desc, eq, and, ne, or, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import index from "./index.html";
import {
  withAuth,
  withFeedback,
  canAccessFeedback,
  withAdmin,
} from "./lib/guards";

const spaEntry: any =
  process.env.NODE_ENV === "production"
    ? ({ set }: { set: { headers: Record<string, string> } }) => {
        set.headers["Content-Type"] = "text/html";
        return Bun.file("./dist/index.html");
      }
    : index;

export const app = new Elysia()
  .use(swagger())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "Fischl von Luftschloss Narfidort",
      exp: "7d",
    })
  )
  .use(cookie())
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.auth?.value;

    if (!token || typeof token !== "string") {
      return { user: null };
    }

    const payload = await jwt.verify(token);

    if (!payload) {
      return { user: null };
    }

    return { user: payload };
  })
  .post(
    "/api/register",
    async ({ body, jwt, cookie, set }) => {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1);

      if (existingUser.length > 0) {
        set.status = 400;
        return { error: "Username already exists" };
      }

      const hashedPassword = await bcrypt.hash(body.password, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          username: body.username,
          password: hashedPassword,
        })
        .returning();

      if (!newUser) {
        set.status = 500;
        return { error: "Failed to create user" };
      }

      const token = await jwt.sign({
        id: newUser.id,
        username: newUser.username,
      });

      cookie.auth?.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
      });

      return {
        success: true,
        user: { id: newUser.id, username: newUser.username },
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )
  .post(
    "/api/login",
    async ({ body, jwt, cookie, set }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1);

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isValid = await bcrypt.compare(body.password, user.password);

      if (!isValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({ id: user.id, username: user.username });

      cookie.auth?.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
      });

      return { success: true, user: { id: user.id, username: user.username } };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post("/api/logout", async ({ cookie, set }) => {
    cookie.auth?.remove();
    return { success: true };
  })
  .get("/api/me", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    return { user };
  })
  .use(withAuth)
  .get("/api/users", async ({ user }) => {
    if (!user) {
      throw new Error("Unauthorized");
    }
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(ne(users.id, user.id as number))
      .orderBy(users.username);
    return allUsers;
  })
  .get("/api/feedback-requests/my", async ({ user }) => {
    if (!user) {
      throw new Error("Unauthorized");
    }
    const myRequests = await db
      .select({
        id: feedbackRequests.id,
        requestedUserId: feedbackRequests.requestedUserId,
        username: users.username,
      })
      .from(feedbackRequests)
      .innerJoin(users, eq(users.id, feedbackRequests.requestedUserId))
      .where(eq(feedbackRequests.userId, user.id as number));
    return myRequests;
  })
  .get("/api/feedback-requests/received", async ({ user }) => {
    if (!user) {
      throw new Error("Unauthorized");
    }
    const receivedRequests = await db
      .select({
        id: feedbackRequests.id,
        userId: feedbackRequests.userId,
        username: users.username,
      })
      .from(feedbackRequests)
      .innerJoin(users, eq(users.id, feedbackRequests.userId))
      .where(eq(feedbackRequests.requestedUserId, user.id as number));
    return receivedRequests;
  })
  .get("/api/feedback-requests/check", async ({ user }) => {
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existingRequests = await db
      .select()
      .from(feedbackRequests)
      .where(eq(feedbackRequests.userId, user.id as number))
      .limit(1);
    return { hasRequests: existingRequests.length > 0 };
  })
  .post(
    "/api/feedback-requests",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const existingRequests = await db
        .select()
        .from(feedbackRequests)
        .where(eq(feedbackRequests.userId, user.id as number))
        .limit(1);

      if (existingRequests.length > 0) {
        set.status = 400;
        return { error: "Feedback requests already submitted" };
      }

      if (!Array.isArray(body.userIds) || body.userIds.length !== 5) {
        set.status = 400;
        return { error: "Exactly 5 users must be selected" };
      }

      const userId = user.id as number;
      const uniqueUserIds = [...new Set(body.userIds)];

      if (uniqueUserIds.length !== 5) {
        set.status = 400;
        return { error: "Duplicate users not allowed" };
      }

      if (uniqueUserIds.some((id) => id === userId)) {
        set.status = 400;
        return { error: "Cannot request feedback from yourself" };
      }

      const validUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, uniqueUserIds));

      if (validUsers.length !== 5) {
        set.status = 400;
        return { error: "Invalid user IDs" };
      }

      const requests = uniqueUserIds.map((requestedUserId) => ({
        userId,
        requestedUserId,
      }));

      const inserted = await db
        .insert(feedbackRequests)
        .values(requests)
        .returning();

      return { success: true, requests: inserted };
    },
    {
      body: t.Object({
        userIds: t.Array(t.Number(), { minItems: 5, maxItems: 5 }),
      }),
    }
  )
  // DTOs (typed from Drizzle) for Eden end-to-end typing
  // Note: createdAt is serialized as epoch ms numbers for stable JSON types.
  .get(
    "/api/valuation-questions",
    async ({ user }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      const groups = await db
        .select()
        .from(valuationQuestionGroups)
        .orderBy(valuationQuestionGroups.order, valuationQuestionGroups.id);

      type ValuationQuestionDTO = Pick<
        ValuationQuestion,
        "id" | "groupId" | "questionText" | "order"
      > & { createdAt: number };
      type ValuationQuestionGroupDTO = Pick<
        ValuationQuestionGroup,
        "id" | "title" | "order"
      > & { createdAt: number; questions: ValuationQuestionDTO[] };

      const groupsWithQuestions: ValuationQuestionGroupDTO[] =
        await Promise.all(
          groups.map(async (group) => {
            const questions = await db
              .select()
              .from(valuationQuestions)
              .where(eq(valuationQuestions.groupId, group.id))
              .orderBy(valuationQuestions.order, valuationQuestions.id);
            return {
              ...group,
              createdAt: group.createdAt.getTime(),
              questions: questions.map((q) => ({
                ...q,
                createdAt: q.createdAt.getTime(),
              })),
            };
          })
        );

      return groupsWithQuestions;
    },
    {
      response: t.Array(
        t.Object({
          id: t.Number(),
          title: t.String(),
          order: t.Number(),
          createdAt: t.Number(),
          questions: t.Array(
            t.Object({
              id: t.Number(),
              groupId: t.Number(),
              questionText: t.String(),
              order: t.Number(),
              createdAt: t.Number(),
            })
          ),
        })
      ),
    }
  )
  .use(withAdmin)
  .get(
    "/api/admin/valuation-question-groups",
    async () => {
      const groups = await db
        .select()
        .from(valuationQuestionGroups)
        .orderBy(valuationQuestionGroups.order, valuationQuestionGroups.id);

      type AdminValuationQuestionDTO = Pick<
        ValuationQuestion,
        "id" | "groupId" | "questionText" | "order"
      > & { createdAt: number };
      type AdminValuationQuestionGroupDTO = Pick<
        ValuationQuestionGroup,
        "id" | "title" | "order"
      > & { createdAt: number; questions: AdminValuationQuestionDTO[] };

      const groupsWithQuestions: AdminValuationQuestionGroupDTO[] =
        await Promise.all(
          groups.map(async (group) => {
            const questions = await db
              .select()
              .from(valuationQuestions)
              .where(eq(valuationQuestions.groupId, group.id))
              .orderBy(valuationQuestions.order, valuationQuestions.id);
            return {
              ...group,
              createdAt: group.createdAt.getTime(),
              questions: questions.map((q) => ({
                ...q,
                createdAt: q.createdAt.getTime(),
              })),
            };
          })
        );

      return groupsWithQuestions;
    },
    {
      response: t.Array(
        t.Object({
          id: t.Number(),
          title: t.String(),
          order: t.Number(),
          createdAt: t.Number(),
          questions: t.Array(
            t.Object({
              id: t.Number(),
              groupId: t.Number(),
              questionText: t.String(),
              order: t.Number(),
              createdAt: t.Number(),
            })
          ),
        })
      ),
    }
  )
  .post(
    "/api/admin/valuation-question-groups",
    async ({ body, set }) => {
      const groups = await db
        .select()
        .from(valuationQuestionGroups)
        .orderBy(valuationQuestionGroups.order);

      const lastGroup = groups.length > 0 ? groups[groups.length - 1] : null;
      const [newGroup] = await db
        .insert(valuationQuestionGroups)
        .values({
          title: body.title,
          order: body.order ?? (lastGroup ? lastGroup.order + 1 : 0),
        })
        .returning();

      if (!newGroup) {
        set.status = 500;
        return { error: "Failed to create group" };
      }

      return newGroup;
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        order: t.Optional(t.Number()),
      }),
    }
  )
  .put(
    "/api/admin/valuation-question-groups/:id",
    async ({ params, body, set }) => {
      const groupId = Number(params.id);
      if (isNaN(groupId)) {
        set.status = 400;
        return { error: "Invalid group ID" };
      }

      const [updatedGroup] = await db
        .update(valuationQuestionGroups)
        .set({
          title: body.title,
          order: body.order ?? 0,
        })
        .where(eq(valuationQuestionGroups.id, groupId))
        .returning();

      if (!updatedGroup) {
        set.status = 404;
        return { error: "Group not found" };
      }

      return updatedGroup;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1 }),
        order: t.Optional(t.Number()),
      }),
    }
  )
  .delete(
    "/api/admin/valuation-question-groups/:id",
    async ({ params, set }) => {
      const groupId = Number(params.id);
      if (isNaN(groupId)) {
        set.status = 400;
        return { error: "Invalid group ID" };
      }

      await db
        .delete(valuationQuestionGroups)
        .where(eq(valuationQuestionGroups.id, groupId));

      return { success: true };
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .post(
    "/api/admin/valuation-questions",
    async ({ body, set }) => {
      const questions = await db
        .select()
        .from(valuationQuestions)
        .where(eq(valuationQuestions.groupId, body.groupId))
        .orderBy(valuationQuestions.order);

      const lastQuestion =
        questions.length > 0 ? questions[questions.length - 1] : null;
      const [newQuestion] = await db
        .insert(valuationQuestions)
        .values({
          groupId: body.groupId,
          questionText: body.questionText,
          order: body.order ?? (lastQuestion ? lastQuestion.order + 1 : 0),
        })
        .returning();

      if (!newQuestion) {
        set.status = 500;
        return { error: "Failed to create question" };
      }

      return newQuestion;
    },
    {
      body: t.Object({
        groupId: t.Number(),
        questionText: t.String({ minLength: 1 }),
        order: t.Optional(t.Number()),
      }),
    }
  )
  .put(
    "/api/admin/valuation-questions/:id",
    async ({ params, body, set }) => {
      const questionId = Number(params.id);
      if (isNaN(questionId)) {
        set.status = 400;
        return { error: "Invalid question ID" };
      }

      const [updatedQuestion] = await db
        .update(valuationQuestions)
        .set({
          questionText: body.questionText,
          order: body.order ?? 0,
        })
        .where(eq(valuationQuestions.id, questionId))
        .returning();

      if (!updatedQuestion) {
        set.status = 404;
        return { error: "Question not found" };
      }

      return updatedQuestion;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Object({
        questionText: t.String({ minLength: 1 }),
        order: t.Optional(t.Number()),
      }),
    }
  )
  .delete(
    "/api/admin/valuation-questions/:id",
    async ({ params, set }) => {
      const questionId = Number(params.id);
      if (isNaN(questionId)) {
        set.status = 400;
        return { error: "Invalid question ID" };
      }

      await db
        .delete(valuationQuestions)
        .where(eq(valuationQuestions.id, questionId));

      return { success: true };
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .get("/api/feedback", async ({ user }) => {
    if (!user) {
      throw new Error("Unauthorized");
    }
    const sentFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.fromUserId, user.id as number))
      .orderBy(desc(feedback.createdAt));

    const receivedFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.toUserId, user.id as number))
      .orderBy(desc(feedback.createdAt));

    const allFeedback = [...sentFeedback, ...receivedFeedback];
    const feedbackIds = allFeedback.map((f) => f.id);

    if (feedbackIds.length === 0) {
      return {
        sent: [],
        received: [],
      };
    }

    // Fetch all related data in parallel with efficient queries
    const [allGroups, allQuestions, allGroupAnswers, allQuestionAnswers] =
      await Promise.all([
        db
          .select()
          .from(valuationQuestionGroups)
          .orderBy(valuationQuestionGroups.order, valuationQuestionGroups.id),
        db
          .select()
          .from(valuationQuestions)
          .orderBy(valuationQuestions.order, valuationQuestions.id),
        db
          .select()
          .from(valuationGroupAnswers)
          .where(inArray(valuationGroupAnswers.feedbackId, feedbackIds)),
        db
          .select()
          .from(valuationAnswers)
          .where(inArray(valuationAnswers.feedbackId, feedbackIds)),
      ]);

    // Create lookup maps for efficient data access
    const questionsByGroupId = new Map<number, typeof allQuestions>();
    for (const question of allQuestions) {
      const existing = questionsByGroupId.get(question.groupId) || [];
      existing.push(question);
      questionsByGroupId.set(question.groupId, existing);
    }

    const groupAnswersByFeedbackId = new Map<
      number,
      Map<number, (typeof allGroupAnswers)[0]>
    >();
    for (const groupAnswer of allGroupAnswers) {
      if (!groupAnswersByFeedbackId.has(groupAnswer.feedbackId)) {
        groupAnswersByFeedbackId.set(
          groupAnswer.feedbackId,
          new Map<number, (typeof allGroupAnswers)[0]>()
        );
      }
      groupAnswersByFeedbackId
        .get(groupAnswer.feedbackId)!
        .set(groupAnswer.groupId, groupAnswer);
    }

    const questionAnswersByFeedbackId = new Map<
      number,
      Map<number, (typeof allQuestionAnswers)[0]>
    >();
    for (const questionAnswer of allQuestionAnswers) {
      if (!questionAnswersByFeedbackId.has(questionAnswer.feedbackId)) {
        questionAnswersByFeedbackId.set(
          questionAnswer.feedbackId,
          new Map<number, (typeof allQuestionAnswers)[0]>()
        );
      }
      questionAnswersByFeedbackId
        .get(questionAnswer.feedbackId)!
        .set(questionAnswer.questionId, questionAnswer);
    }

    // Helper function to build groups with data for a feedback item
    const buildGroupsWithData = (feedbackId: number) => {
      return allGroups.map((group) => {
        const groupAnswer = groupAnswersByFeedbackId
          .get(feedbackId)
          ?.get(group.id);
        const questions = questionsByGroupId.get(group.id) || [];

        const questionAnswers = questions.map((question) => {
          const answer = questionAnswersByFeedbackId
            .get(feedbackId)
            ?.get(question.id);
          return {
            questionId: question.id,
            questionText: question.questionText,
            rating: answer?.rating || null,
          };
        });

        return {
          groupId: group.id,
          groupTitle: group.title,
          comment: groupAnswer?.comment || null,
          questions: questionAnswers,
        };
      });
    };

    const sentFeedbackWithAnswers = sentFeedback.map((f) => ({
      id: f.id,
      toUserId: f.toUserId,
      groups: buildGroupsWithData(f.id),
      createdAt: f.createdAt,
      isAuthor: true,
    }));

    const receivedFeedbackWithAnswers = receivedFeedback.map((f) => ({
      id: f.id,
      groups: buildGroupsWithData(f.id),
      createdAt: f.createdAt,
      isAuthor: false,
    }));

    return {
      sent: sentFeedbackWithAnswers,
      received: receivedFeedbackWithAnswers,
    };
  })
  .post(
    "/api/feedback",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const receivedRequests = await db
        .select()
        .from(feedbackRequests)
        .where(
          and(
            eq(feedbackRequests.requestedUserId, user.id as number),
            eq(feedbackRequests.userId, body.toUserId)
          )
        )
        .limit(1);

      if (receivedRequests.length === 0) {
        set.status = 403;
        return {
          error:
            "You can only give feedback to users who requested it from you",
        };
      }

      const groups = await db
        .select()
        .from(valuationQuestionGroups)
        .orderBy(valuationQuestionGroups.order, valuationQuestionGroups.id);

      if (groups.length === 0) {
        set.status = 400;
        return { error: "No valuation question groups available" };
      }

      const allQuestions = await db
        .select()
        .from(valuationQuestions)
        .orderBy(valuationQuestions.order, valuationQuestions.id);

      if (allQuestions.length === 0) {
        set.status = 400;
        return { error: "No valuation questions available" };
      }

      if (!Array.isArray(body.groups)) {
        set.status = 400;
        return { error: "Groups must be provided" };
      }

      const [newFeedback] = await db
        .insert(feedback)
        .values({
          fromUserId: user.id as number,
          toUserId: body.toUserId,
        })
        .returning();

      if (!newFeedback) {
        set.status = 500;
        return { error: "Failed to create feedback" };
      }

      for (const groupData of body.groups) {
        const groupId = groupData.groupId;
        const questionAnswers = groupData.questions || [];

        for (const answer of questionAnswers) {
          await db.insert(valuationAnswers).values({
            feedbackId: newFeedback.id,
            questionId: answer.questionId,
            rating: answer.rating,
          });
        }

        if (groupData.comment && groupData.comment.trim()) {
          await db.insert(valuationGroupAnswers).values({
            feedbackId: newFeedback.id,
            groupId: groupId,
            comment: groupData.comment.trim(),
          });
        }
      }

      return {
        id: newFeedback.id,
        toUserId: newFeedback.toUserId,
        createdAt: newFeedback.createdAt,
        isAuthor: true,
      };
    },
    {
      body: t.Object({
        toUserId: t.Number(),
        groups: t.Array(
          t.Object({
            groupId: t.Number(),
            questions: t.Array(
              t.Object({
                questionId: t.Number(),
                rating: t.Number({ minimum: 1, maximum: 5 }),
              })
            ),
            comment: t.Optional(t.String()),
          })
        ),
      }),
    }
  )
  .get(
    "/api/feedback/:feedbackId",
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const feedbackId = Number(params.feedbackId);

      if (isNaN(feedbackId)) {
        set.status = 400;
        return { error: "Invalid feedback ID" };
      }

      const [feedbackItem] = await db
        .select()
        .from(feedback)
        .where(eq(feedback.id, feedbackId))
        .limit(1);

      if (!feedbackItem) {
        set.status = 404;
        return { error: "Feedback not found" };
      }

      const isAuthor = feedbackItem.fromUserId === user.id;
      const isReceiver = feedbackItem.toUserId === user.id;

      if (!isAuthor && !isReceiver) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      // Fetch all related data in parallel with efficient queries
      const [allGroups, allQuestions, groupAnswers, questionAnswers] =
        await Promise.all([
          db
            .select()
            .from(valuationQuestionGroups)
            .orderBy(valuationQuestionGroups.order, valuationQuestionGroups.id),
          db
            .select()
            .from(valuationQuestions)
            .orderBy(valuationQuestions.order, valuationQuestions.id),
          db
            .select()
            .from(valuationGroupAnswers)
            .where(eq(valuationGroupAnswers.feedbackId, feedbackId)),
          db
            .select()
            .from(valuationAnswers)
            .where(eq(valuationAnswers.feedbackId, feedbackId)),
        ]);

      // Create lookup maps for efficient data access
      const questionsByGroupId = new Map<number, typeof allQuestions>();
      for (const question of allQuestions) {
        const existing = questionsByGroupId.get(question.groupId) || [];
        existing.push(question);
        questionsByGroupId.set(question.groupId, existing);
      }

      const groupAnswerMap = new Map<number, (typeof groupAnswers)[0]>();
      for (const groupAnswer of groupAnswers) {
        groupAnswerMap.set(groupAnswer.groupId, groupAnswer);
      }

      const questionAnswerMap = new Map<number, (typeof questionAnswers)[0]>();
      for (const questionAnswer of questionAnswers) {
        questionAnswerMap.set(questionAnswer.questionId, questionAnswer);
      }

      // Build groups with data
      const groupsWithData = allGroups.map((group) => {
        const groupAnswer = groupAnswerMap.get(group.id);
        const questions = questionsByGroupId.get(group.id) || [];

        const questionAnswersData = questions.map((question) => {
          const answer = questionAnswerMap.get(question.id);
          return {
            questionId: question.id,
            questionText: question.questionText,
            rating: answer?.rating || null,
          };
        });

        return {
          groupId: group.id,
          groupTitle: group.title,
          comment: groupAnswer?.comment || null,
          questions: questionAnswersData,
        };
      });

      if (isReceiver) {
        return {
          id: feedbackItem.id,
          groups: groupsWithData,
          createdAt: feedbackItem.createdAt,
          isAuthor: false,
        };
      }

      return {
        id: feedbackItem.id,
        toUserId: feedbackItem.toUserId,
        groups: groupsWithData,
        createdAt: feedbackItem.createdAt,
        isAuthor: true,
      };
    },
    {
      params: t.Object({
        feedbackId: t.Numeric(),
      }),
    }
  )
  .get("/login", spaEntry)
  .get("/register", spaEntry)
  .get("/dashboard", spaEntry)
  .get("/admin", spaEntry)
  .use(
    await staticPlugin({
      assets: process.env.NODE_ENV === "production" ? "./dist" : "./src",
      prefix: "/",
      alwaysStatic: true,
      staticLimit: 1_000_000,
      extension: true,
      indexHTML: true,
    })
  );

export type App = typeof app;

// Only listen when running directly (not in tests)
if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port);
  console.log(
    `🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`
  );
}
