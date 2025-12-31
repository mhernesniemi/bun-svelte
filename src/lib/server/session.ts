import type { RequestEvent } from "@sveltejs/kit";
import { SignJWT, jwtVerify } from "jose";
import { getUserById } from "./auth";

const COOKIE_NAME = "session";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getSessionUser(event: RequestEvent) {
  const token = event.cookies.get(COOKIE_NAME);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as number;
    if (!Number.isFinite(userId)) return null;
    return getUserById(userId);
  } catch {
    return null;
  }
}

export async function setSession(event: RequestEvent, userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  event.cookies.set(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: event.url.protocol === "https:",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession(event: RequestEvent) {
  event.cookies.delete(COOKIE_NAME, { path: "/" });
}
