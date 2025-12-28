import { Elysia } from "elysia";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq } from "drizzle-orm";

export const withAuth = new Elysia().derive(async ({ user, set }) => {
  if (!user) {
    set.status = 401;
    throw new Error("Unauthorized");
  }
  return { user: user as { id: number; username: string } };
});

export const withFeedback = new Elysia().derive(async ({ params, set }) => {
  const feedbackId = Number(params.feedbackId);

  if (isNaN(feedbackId)) {
    set.status = 400;
    throw new Error("Invalid feedback ID");
  }

  const [feedbackItem] = await db
    .select()
    .from(feedback)
    .where(eq(feedback.id, feedbackId))
    .limit(1);

  if (!feedbackItem) {
    set.status = 404;
    throw new Error("Feedback not found");
  }

  return { feedback: feedbackItem };
});

export const canAccessFeedback = new Elysia().onBeforeHandle(
  ({ user, feedback, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }

    const isAuthor = feedback.fromUserId === user.id;
    const isReceiver = feedback.toUserId === user.id;

    if (!isAuthor && !isReceiver) {
      set.status = 403;
      throw new Error("Forbidden");
    }
  }
);

export const authorOnly = new Elysia().onBeforeHandle(
  ({ user, feedback, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }

    if (feedback.fromUserId !== user.id) {
      set.status = 403;
      throw new Error("Only author allowed");
    }
  }
);

export const receiverOnly = new Elysia().onBeforeHandle(
  ({ user, feedback, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }

    if (feedback.toUserId !== user.id) {
      set.status = 403;
      throw new Error("Only receiver allowed");
    }
  }
);

export const withAdmin = new Elysia()
  .use(withAuth)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }

    const adminEmail = "zernobillyguy@gmail.com";
    if (user.username !== adminEmail) {
      set.status = 403;
      throw new Error("Admin access required");
    }
  });
