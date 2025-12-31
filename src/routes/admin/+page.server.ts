import { fail, redirect } from "@sveltejs/kit";
import { asc, eq, and, isNull } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "@/server/db";
import { valuationQuestionGroups, valuationQuestions } from "@/server/db/schema";
import { env } from "$env/dynamic/private";

const ADMIN_USER = env.ADMIN_USER;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, "/login");
  if (locals.user.username !== ADMIN_USER) throw redirect(303, "/dashboard");

  const groups = await db
    .select()
    .from(valuationQuestionGroups)
    .where(isNull(valuationQuestionGroups.deletedAt))
    .orderBy(asc(valuationQuestionGroups.order));
  const groupsWithQuestions = await Promise.all(
    groups.map(async (g) => {
      const questions = await db
        .select()
        .from(valuationQuestions)
        .where(and(eq(valuationQuestions.groupId, g.id), isNull(valuationQuestions.deletedAt)))
        .orderBy(asc(valuationQuestions.order));
      return { ...g, questions };
    })
  );

  return { groups: groupsWithQuestions };
};

export const actions: Actions = {
  createGroup: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const title = data.get("title")?.toString().trim();
    if (!title) return fail(400, { error: "Title is required" });
    await db.insert(valuationQuestionGroups).values({ title, order: 0 });
    return { ok: true };
  },
  createQuestion: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const groupId = Number(data.get("groupId")?.toString());
    const questionText = data.get("questionText")?.toString().trim();
    if (!Number.isFinite(groupId) || !questionText) return fail(400, { error: "Invalid data" });

    // Get max order for this group
    const existingQuestions = await db
      .select()
      .from(valuationQuestions)
      .where(and(eq(valuationQuestions.groupId, groupId), isNull(valuationQuestions.deletedAt)))
      .orderBy(asc(valuationQuestions.order));
    const maxOrder =
      existingQuestions.length > 0 ? Math.max(...existingQuestions.map((q) => q.order)) : -1;

    await db.insert(valuationQuestions).values({ groupId, questionText, order: maxOrder + 1 });
    return { ok: true };
  },
  reorderQuestions: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const questionIdsJson = data.get("questionIds")?.toString();
    if (!questionIdsJson) return fail(400, { error: "Question IDs are required" });

    const questionIds: number[] = JSON.parse(questionIdsJson);
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return fail(400, { error: "Invalid question IDs" });
    }

    // Update order for each question
    await Promise.all(
      questionIds.map((questionId, index) =>
        db
          .update(valuationQuestions)
          .set({ order: index })
          .where(eq(valuationQuestions.id, questionId))
      )
    );

    return { ok: true };
  },
  updateQuestion: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const questionId = Number(data.get("questionId")?.toString());
    const questionText = data.get("questionText")?.toString().trim();
    if (!Number.isFinite(questionId) || !questionText) return fail(400, { error: "Invalid data" });

    await db
      .update(valuationQuestions)
      .set({ questionText })
      .where(eq(valuationQuestions.id, questionId));

    return { ok: true };
  },
  deleteQuestion: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const questionId = Number(data.get("questionId")?.toString());
    if (!Number.isFinite(questionId)) return fail(400, { error: "Invalid question ID" });

    await db
      .update(valuationQuestions)
      .set({ deletedAt: new Date() })
      .where(eq(valuationQuestions.id, questionId));

    return { ok: true };
  },
  deleteGroup: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_USER)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const groupId = Number(data.get("groupId")?.toString());
    if (!Number.isFinite(groupId)) return fail(400, { error: "Invalid group ID" });

    await db
      .update(valuationQuestionGroups)
      .set({ deletedAt: new Date() })
      .where(eq(valuationQuestionGroups.id, groupId));

    return { ok: true };
  }
};
