import type { Handle, HandleServerError } from "@sveltejs/kit";
import { getSessionUser } from "@/server/session";

export const handle: Handle = async ({ event, resolve }) => {
  try {
    const user = await getSessionUser(event);
    event.locals.user = user ? { id: user.id, username: user.username } : null;
    return await resolve(event);
  } catch (error) {
    console.error("Error in handle hook:", error);
    event.locals.user = null;
    return await resolve(event);
  }
};

export const handleError: HandleServerError = ({ error }) => {
  console.error("Server error:", error);
  
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  const status = (error as any)?.status ?? 500;

  return {
    message,
    status
  };
};
