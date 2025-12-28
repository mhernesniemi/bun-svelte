import type { Handle } from "@sveltejs/kit";
import { getSessionUser } from "@/server/session";

export const handle: Handle = async ({ event, resolve }) => {
  const user = await getSessionUser(event);
  event.locals.user = user ? { id: user.id, username: user.username } : null;
  return resolve(event);
};
