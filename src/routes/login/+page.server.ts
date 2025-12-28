import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { getUserByUsername, verifyPassword } from "@/server/auth";
import { setSession } from "@/server/session";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, "/dashboard");
};

export const actions: Actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const username = data.get("username")?.toString().trim();
    const password = data.get("password")?.toString();

    if (!username || !password) return fail(400, { error: "Username and password are required" });

    const user = await getUserByUsername(username);
    if (!user) return fail(400, { error: "Invalid username or password" });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return fail(400, { error: "Invalid username or password" });

    setSession(event, user.id);
    throw redirect(303, "/dashboard");
  }
};
