import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createUser, getUserByUsername } from '@/server/auth';
import { setSession } from '@/server/session';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!username || !password) return fail(400, { error: 'Username and password are required' });
		if (password.length < 6) return fail(400, { error: 'Password must be at least 6 characters' });

		const existing = await getUserByUsername(username);
		if (existing) return fail(400, { error: 'Username already exists' });

		const user = await createUser(username, password);
		setSession(event, user.id);
		throw redirect(303, '/dashboard');
	}
};


