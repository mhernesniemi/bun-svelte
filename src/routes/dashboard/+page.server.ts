import { fail, redirect } from "@sveltejs/kit";
import { asc, eq, ne, and } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "@/server/db";
import {
  feedback,
  feedbackRequests,
  feedbackDrafts,
  users,
  valuationAnswers,
  valuationGroupAnswers,
  valuationQuestionGroups,
  valuationQuestions
} from "@/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, "/login");

  const [existing] = await db
    .select()
    .from(feedbackRequests)
    .where(eq(feedbackRequests.userId, locals.user.id))
    .limit(1);

  const hasRequests = Boolean(existing);

  const receivedRequests = await db
    .select({
      id: feedbackRequests.id,
      userId: feedbackRequests.userId,
      username: users.username
    })
    .from(feedbackRequests)
    .innerJoin(users, eq(users.id, feedbackRequests.userId))
    .where(eq(feedbackRequests.requestedUserId, locals.user.id));

  const selectableUsers = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(ne(users.id, locals.user.id))
    .orderBy(asc(users.username));

  const groups = await db
    .select()
    .from(valuationQuestionGroups)
    .orderBy(asc(valuationQuestionGroups.order));

  const groupsWithQuestions = await Promise.all(
    groups.map(async (g) => {
      const questions = await db
        .select()
        .from(valuationQuestions)
        .where(eq(valuationQuestions.groupId, g.id))
        .orderBy(asc(valuationQuestions.order));
      return { ...g, questions };
    })
  );

  const drafts = await db
    .select()
    .from(feedbackDrafts)
    .where(eq(feedbackDrafts.fromUserId, locals.user.id));

  const draftsMap = new Map(
    drafts.map((d) => [
      d.toUserId,
      JSON.parse(d.groups) as Array<{
        groupId: number;
        questions: Array<{ questionId: number; rating: number }>;
        comment?: string;
      }>
    ])
  );

  const submittedFeedback = await db
    .select({ toUserId: feedback.toUserId })
    .from(feedback)
    .where(eq(feedback.fromUserId, locals.user.id));

  const submittedFeedbackSet = new Set(submittedFeedback.map((f) => f.toUserId));

  return {
    user: locals.user,
    hasRequests,
    receivedRequests,
    users: selectableUsers,
    groups: groupsWithQuestions,
    drafts: draftsMap,
    submittedFeedback: submittedFeedbackSet
  };
};

export const actions: Actions = {
  createRequests: async (event) => {
    if (!event.locals.user) return fail(401, { error: "Unauthorized" });

    const data = await event.request.formData();
    const userIdsRaw = data.get("userIds")?.toString();
    if (!userIdsRaw) return fail(400, { error: "User IDs are required" });

    let userIds: number[];
    try {
      userIds = JSON.parse(userIdsRaw);
    } catch {
      return fail(400, { error: "Invalid user IDs" });
    }

    const unique = Array.from(new Set(userIds)).filter((n) => Number.isFinite(n));
    if (unique.length !== 5) return fail(400, { error: "Select exactly 5 colleagues" });

    const [existing] = await db
      .select()
      .from(feedbackRequests)
      .where(eq(feedbackRequests.userId, event.locals.user.id))
      .limit(1);
    if (existing) return fail(400, { error: "Selection already saved" });

    await db.insert(feedbackRequests).values(
      unique.map((requestedUserId) => ({
        userId: event.locals.user!.id,
        requestedUserId
      }))
    );

    return { ok: true };
  },

  createFeedback: async (event) => {
    if (!event.locals.user) return fail(401, { error: "Unauthorized" });

    const data = await event.request.formData();
    const toUserId = Number(data.get("toUserId")?.toString());
    const groupsRaw = data.get("groups")?.toString();

    if (!Number.isFinite(toUserId) || !groupsRaw) return fail(400, { error: "Invalid payload" });

    let groups: Array<{
      groupId: number;
      questions: Array<{ questionId: number; rating: number }>;
      comment?: string;
    }>;

    try {
      groups = JSON.parse(groupsRaw);
    } catch {
      return fail(400, { error: "Invalid payload" });
    }

    for (const g of groups) {
      for (const q of g.questions) {
        if (!Number.isFinite(q.rating) || q.rating < 1 || q.rating > 5) {
          return fail(400, { error: "Please answer all questions with a rating from 1 to 5." });
        }
      }
    }

    const [created] = await db
      .insert(feedback)
      .values({ fromUserId: event.locals.user.id, toUserId })
      .returning();

    for (const g of groups) {
      for (const q of g.questions) {
        await db.insert(valuationAnswers).values({
          feedbackId: created.id,
          questionId: q.questionId,
          rating: q.rating
        });
      }
      if (g.comment?.trim()) {
        await db.insert(valuationGroupAnswers).values({
          feedbackId: created.id,
          groupId: g.groupId,
          comment: g.comment.trim()
        });
      }
    }

    await db
      .delete(feedbackDrafts)
      .where(
        and(
          eq(feedbackDrafts.fromUserId, event.locals.user.id),
          eq(feedbackDrafts.toUserId, toUserId)
        )
      );

    return { ok: true };
  },

  autosave: async (event) => {
    if (!event.locals.user) return fail(401, { error: "Unauthorized" });

    const data = await event.request.formData();
    const toUserId = Number(data.get("toUserId")?.toString());
    const groupsRaw = data.get("groups")?.toString();

    if (!Number.isFinite(toUserId) || !groupsRaw) return fail(400, { error: "Invalid payload" });

    try {
      JSON.parse(groupsRaw);
    } catch {
      return fail(400, { error: "Invalid payload" });
    }

    const [existing] = await db
      .select()
      .from(feedbackDrafts)
      .where(
        and(
          eq(feedbackDrafts.fromUserId, event.locals.user.id),
          eq(feedbackDrafts.toUserId, toUserId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(feedbackDrafts)
        .set({ groups: groupsRaw, updatedAt: new Date() })
        .where(eq(feedbackDrafts.id, existing.id));
    } else {
      await db.insert(feedbackDrafts).values({
        fromUserId: event.locals.user.id,
        toUserId,
        groups: groupsRaw
      });
    }

    return { ok: true };
  }
};
