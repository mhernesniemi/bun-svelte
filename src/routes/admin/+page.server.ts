import { fail, redirect } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "@/server/db";
import { valuationQuestionGroups, valuationQuestions } from "@/server/db/schema";

const ADMIN_EMAIL = "zernobillyguy@gmail.com";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, "/login");
  if (locals.user.username !== ADMIN_EMAIL) throw redirect(303, "/dashboard");

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

  return { groups: groupsWithQuestions };
};

export const actions: Actions = {
  createGroup: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_EMAIL)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const title = data.get("title")?.toString().trim();
    if (!title) return fail(400, { error: "Title is required" });
    await db.insert(valuationQuestionGroups).values({ title, order: 0 });
    return { ok: true };
  },
  createQuestion: async ({ locals, request }) => {
    if (!locals.user || locals.user.username !== ADMIN_EMAIL)
      return fail(401, { error: "Unauthorized" });
    const data = await request.formData();
    const groupId = Number(data.get("groupId")?.toString());
    const questionText = data.get("questionText")?.toString().trim();
    if (!Number.isFinite(groupId) || !questionText) return fail(400, { error: "Invalid data" });
    await db.insert(valuationQuestions).values({ groupId, questionText, order: 0 });
    return { ok: true };
  }
};
