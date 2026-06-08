// Cookie-based sessions and passphrase hashing.
//
// Identity model (no email, privacy-minded for protesters):
//  - A "username" account is protected by a passphrase so the same person can
//    log back in from another device.
//  - An "anonymous" account has a generated handle and no passphrase; it lives
//    only as long as the browser keeps the session cookie.
//
// The session cookie holds `userId:secret`. `secret` is a random per-user value
// so a cookie can't be forged just by guessing a user id.

import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { getUserById } from "./store";
import type { PublicUser, StoredUser } from "./types";

const COOKIE = "shqipot_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function hashPassphrase(passphrase: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passphrase, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassphrase(passphrase: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(passphrase, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function newSecret(): string {
  return randomBytes(24).toString("hex");
}

export async function createSession(user: StoredUser): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, `${user.id}:${user.secret}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the full stored user (with secrets) for server-side checks. */
export async function getSessionUser(): Promise<StoredUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [id, secret] = raw.split(":");
  if (!id || !secret) return null;
  const user = getUserById(id);
  if (!user || user.secret !== secret) return null;
  return user;
}

/** Returns the current user as a client-safe object, or null. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return toPublic(user);
}

export function toPublic(user: StoredUser): PublicUser {
  const { passHash: _passHash, secret: _secret, ...pub } = user;
  void _passHash;
  void _secret;
  return pub;
}
