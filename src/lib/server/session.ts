import type { RequestEvent } from '@sveltejs/kit';
import { getUserById } from './auth';

const COOKIE_NAME = 'session';

export async function getSessionUser(event: RequestEvent) {
	const raw = event.cookies.get(COOKIE_NAME);
	if (!raw) return null;
	const id = Number(raw);
	if (!Number.isFinite(id)) return null;
	return getUserById(id);
}

export function setSession(event: RequestEvent, userId: number) {
	event.cookies.set(COOKIE_NAME, String(userId), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 7
	});
}

export function clearSession(event: RequestEvent) {
	event.cookies.delete(COOKIE_NAME, { path: '/' });
}


