import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSession } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	clearSession(event);
	throw redirect(303, '/login');
};


