// Minimal file-backed JSON store. This keeps the demo zero-config (no external
// database) while still persisting across dev server restarts. For real
// deployment with concurrent writers you would swap this for a proper database.
//
// Server-only: imports node:fs, so never import this from a Client Component.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Appeal,
  Candidate,
  Comment,
  Endorsement,
  StoredUser,
} from "./types";

type DB = {
  users: StoredUser[];
  appeals: Appeal[];
  comments: Comment[];
  candidates: Candidate[];
  endorsements: Endorsement[];
};

const DATA_DIR = join(process.cwd(), ".data");
const DB_PATH = join(DATA_DIR, "db.json");

function empty(): DB {
  return {
    users: [],
    appeals: [],
    comments: [],
    candidates: [],
    endorsements: [],
  };
}

function read(): DB {
  if (!existsSync(DB_PATH)) return empty();
  try {
    const raw = readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      users: parsed.users ?? [],
      appeals: parsed.appeals ?? [],
      comments: parsed.comments ?? [],
      candidates: parsed.candidates ?? [],
      endorsements: parsed.endorsements ?? [],
    };
  } catch {
    return empty();
  }
}

function write(db: DB): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// --- Users ---

export function getUserById(id: string): StoredUser | undefined {
  return read().users.find((u) => u.id === id);
}

export function getUserByHandle(handle: string): StoredUser | undefined {
  const lower = handle.toLowerCase();
  return read().users.find((u) => u.handle.toLowerCase() === lower);
}

export function createUser(
  user: Omit<StoredUser, "id" | "createdAt">,
): StoredUser {
  const db = read();
  const stored: StoredUser = { ...user, id: randomUUID(), createdAt: Date.now() };
  db.users.push(stored);
  write(db);
  return stored;
}

// --- Appeals ---

export function listAppeals(): Appeal[] {
  return read().appeals.sort((a, b) => b.createdAt - a.createdAt);
}

export function getAppeal(id: string): Appeal | undefined {
  return read().appeals.find((a) => a.id === id);
}

export function createAppeal(
  appeal: Omit<Appeal, "id" | "createdAt">,
): Appeal {
  const db = read();
  const stored: Appeal = { ...appeal, id: randomUUID(), createdAt: Date.now() };
  db.appeals.push(stored);
  write(db);
  return stored;
}

export function updateAppeal(
  id: string,
  patch: { title: string; body: string },
): Appeal | undefined {
  const db = read();
  const appeal = db.appeals.find((a) => a.id === id);
  if (!appeal) return undefined;
  appeal.title = patch.title;
  appeal.body = patch.body;
  appeal.editedAt = Date.now();
  write(db);
  return appeal;
}

// Deleting an appeal removes it together with all of its comments.
export function deleteAppeal(id: string): void {
  const db = read();
  db.appeals = db.appeals.filter((a) => a.id !== id);
  db.comments = db.comments.filter((c) => c.appealId !== id);
  write(db);
}

// --- Comments ---

export function listComments(appealId: string): Comment[] {
  return read()
    .comments.filter((c) => c.appealId === appealId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getComment(id: string): Comment | undefined {
  return read().comments.find((c) => c.id === id);
}

export function countComments(appealId: string): number {
  return read().comments.filter((c) => c.appealId === appealId).length;
}

export function createComment(
  comment: Omit<Comment, "id" | "createdAt">,
): Comment {
  const db = read();
  const stored: Comment = {
    ...comment,
    id: randomUUID(),
    createdAt: Date.now(),
  };
  db.comments.push(stored);
  write(db);
  return stored;
}

export function updateComment(id: string, body: string): Comment | undefined {
  const db = read();
  const comment = db.comments.find((c) => c.id === id);
  if (!comment) return undefined;
  comment.body = body;
  comment.editedAt = Date.now();
  write(db);
  return comment;
}

// If the comment still has replies, keep it as a tombstone so the thread stays
// intact; otherwise remove it entirely.
export function deleteComment(id: string): void {
  const db = read();
  const comment = db.comments.find((c) => c.id === id);
  if (!comment) return;
  const hasChildren = db.comments.some((c) => c.parentId === id);
  if (hasChildren) {
    comment.deleted = true;
    comment.body = "";
    comment.editedAt = Date.now();
  } else {
    db.comments = db.comments.filter((c) => c.id !== id);
  }
  write(db);
}

// Resolve author handles for a set of authorIds in one pass.
export function handlesFor(authorIds: string[]): Map<string, string> {
  const users = read().users;
  const map = new Map<string, string>();
  for (const id of authorIds) {
    const u = users.find((x) => x.id === id);
    if (u) map.set(id, u.handle);
  }
  return map;
}

// --- Candidates (representatives) ---

export function listCandidates(): Candidate[] {
  return read().candidates;
}

export function getCandidate(id: string): Candidate | undefined {
  return read().candidates.find((c) => c.id === id);
}

export function getCandidateByUser(userId: string): Candidate | undefined {
  return read().candidates.find((c) => c.userId === userId);
}

// Create the user's candidacy, or update it if they already have one.
export function upsertCandidate(
  userId: string,
  patch: { statement: string; categoryKey: string },
): Candidate {
  const db = read();
  const existing = db.candidates.find((c) => c.userId === userId);
  if (existing) {
    existing.statement = patch.statement;
    existing.categoryKey = patch.categoryKey;
    existing.editedAt = Date.now();
    write(db);
    return existing;
  }
  const created: Candidate = {
    id: randomUUID(),
    userId,
    statement: patch.statement,
    categoryKey: patch.categoryKey,
    createdAt: Date.now(),
  };
  db.candidates.push(created);
  write(db);
  return created;
}

export function deleteCandidate(id: string): void {
  const db = read();
  db.candidates = db.candidates.filter((c) => c.id !== id);
  db.endorsements = db.endorsements.filter((e) => e.candidateId !== id);
  write(db);
}

// --- Endorsements ---

export function endorsementCounts(): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of read().endorsements) {
    map.set(e.candidateId, (map.get(e.candidateId) ?? 0) + 1);
  }
  return map;
}

// Candidate ids the given user has endorsed.
export function endorsedBy(userId: string): Set<string> {
  const set = new Set<string>();
  for (const e of read().endorsements) {
    if (e.userId === userId) set.add(e.candidateId);
  }
  return set;
}

// Add or remove the user's endorsement of a candidate. Returns the new state.
export function toggleEndorsement(
  candidateId: string,
  userId: string,
): { endorsed: boolean } {
  const db = read();
  const idx = db.endorsements.findIndex(
    (e) => e.candidateId === candidateId && e.userId === userId,
  );
  if (idx >= 0) {
    db.endorsements.splice(idx, 1);
    write(db);
    return { endorsed: false };
  }
  db.endorsements.push({
    id: randomUUID(),
    candidateId,
    userId,
    createdAt: Date.now(),
  });
  write(db);
  return { endorsed: true };
}
