import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './db/schema';

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function getUserByUsername(username: string) {
	const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	return user ?? null;
}

export async function getUserById(id: number) {
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return user ?? null;
}

export async function createUser(username: string, password: string) {
	const hashed = await hashPassword(password);
	const [user] = await db
		.insert(users)
		.values({ username, password: hashed })
		.returning();
	return user;
}


