// Data access backed by Supabase (Postgres + PostgREST).
//
// Table columns are camelCase (see supabase/schema.sql) to match these types,
// so rows map directly to the app's types with no field translation.
//
// Server-only: imports the service-role Supabase client. Never import this from
// a Client Component.

import { randomUUID } from "node:crypto";
import { supabase } from "./supabase";
import type {
  Appeal,
  Candidate,
  Comment,
  StoredUser,
} from "./types";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// --- Users ---

export async function getUserById(id: string): Promise<StoredUser | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

export async function getUserByHandle(
  handle: string,
): Promise<StoredUser | undefined> {
  // handle is validated to contain no wildcard chars, so ilike is an exact,
  // case-insensitive match.
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("handle", handle)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

export async function createUser(
  user: Omit<StoredUser, "id" | "createdAt">,
): Promise<StoredUser> {
  const stored: StoredUser = { ...user, id: randomUUID(), createdAt: Date.now() };
  unwrap(await supabase.from("users").insert(stored).select().single());
  return stored;
}

// --- Appeals ---

export async function listAppeals(): Promise<Appeal[]> {
  const { data, error } = await supabase
    .from("appeals")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAppeal(id: string): Promise<Appeal | undefined> {
  const { data, error } = await supabase
    .from("appeals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

export async function createAppeal(
  appeal: Omit<Appeal, "id" | "createdAt">,
): Promise<Appeal> {
  const stored: Appeal = { ...appeal, id: randomUUID(), createdAt: Date.now() };
  unwrap(await supabase.from("appeals").insert(stored).select().single());
  return stored;
}

export async function updateAppeal(
  id: string,
  patch: { title: string; body: string; tags: string[] },
): Promise<void> {
  const { error } = await supabase
    .from("appeals")
    .update({ ...patch, editedAt: Date.now() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Deleting an appeal removes it together with all of its comments.
export async function deleteAppeal(id: string): Promise<void> {
  let res = await supabase.from("comments").delete().eq("appealId", id);
  if (res.error) throw new Error(res.error.message);
  res = await supabase.from("appeals").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// --- Comments ---

export async function listComments(appealId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("appealId", appealId)
    .order("createdAt", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getComment(id: string): Promise<Comment | undefined> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

export async function createComment(
  comment: Omit<Comment, "id" | "createdAt">,
): Promise<Comment> {
  const stored: Comment = {
    ...comment,
    id: randomUUID(),
    createdAt: Date.now(),
  };
  unwrap(await supabase.from("comments").insert(stored).select().single());
  return stored;
}

export async function updateComment(id: string, body: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .update({ body, editedAt: Date.now() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// If the comment still has replies, keep it as a tombstone so the thread stays
// intact; otherwise remove it entirely.
export async function deleteComment(id: string): Promise<void> {
  const { data: children, error: childErr } = await supabase
    .from("comments")
    .select("id")
    .eq("parentId", id)
    .limit(1);
  if (childErr) throw new Error(childErr.message);

  if (children && children.length > 0) {
    const { error } = await supabase
      .from("comments")
      .update({ deleted: true, body: "", editedAt: Date.now() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

// Comment counts for a set of appeals, in one query.
export async function commentCountsFor(
  appealIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (appealIds.length === 0) return map;
  const { data, error } = await supabase
    .from("comments")
    .select("appealId")
    .in("appealId", appealIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    map.set(row.appealId, (map.get(row.appealId) ?? 0) + 1);
  }
  return map;
}

// --- Resolve author handles ---

export async function handlesFor(
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return map;
  const { data, error } = await supabase
    .from("users")
    .select("id, handle")
    .in("id", unique);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) map.set(row.id, row.handle);
  return map;
}

// --- Candidates (representatives) ---

export async function listCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase.from("candidates").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

export async function getCandidateByUser(
  userId: string,
): Promise<Candidate | undefined> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? undefined;
}

// Create the user's candidacy, or update it if they already have one.
export async function upsertCandidate(
  userId: string,
  patch: { statement: string; categoryKey: string },
): Promise<Candidate> {
  const existing = await getCandidateByUser(userId);
  if (existing) {
    unwrap(
      await supabase
        .from("candidates")
        .update({ ...patch, editedAt: Date.now() })
        .eq("id", existing.id)
        .select()
        .single(),
    );
    return { ...existing, ...patch, editedAt: Date.now() };
  }
  const created: Candidate = {
    id: randomUUID(),
    userId,
    statement: patch.statement,
    categoryKey: patch.categoryKey,
    createdAt: Date.now(),
  };
  unwrap(await supabase.from("candidates").insert(created).select().single());
  return created;
}

export async function deleteCandidate(id: string): Promise<void> {
  let res = await supabase.from("endorsements").delete().eq("candidateId", id);
  if (res.error) throw new Error(res.error.message);
  res = await supabase.from("candidates").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// --- Endorsements ---

export async function endorsementCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("endorsements")
    .select("candidateId");
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.candidateId, (map.get(row.candidateId) ?? 0) + 1);
  }
  return map;
}

// Candidate ids the given user has endorsed.
export async function endorsedBy(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("endorsements")
    .select("candidateId")
    .eq("userId", userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.candidateId));
}

// Add or remove the user's endorsement of a candidate.
export async function toggleEndorsement(
  candidateId: string,
  userId: string,
): Promise<{ endorsed: boolean }> {
  const { data: existing, error } = await supabase
    .from("endorsements")
    .select("id")
    .eq("candidateId", candidateId)
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (existing) {
    const res = await supabase.from("endorsements").delete().eq("id", existing.id);
    if (res.error) throw new Error(res.error.message);
    return { endorsed: false };
  }
  const res = await supabase.from("endorsements").insert({
    id: randomUUID(),
    candidateId,
    userId,
    createdAt: Date.now(),
  });
  if (res.error) throw new Error(res.error.message);
  return { endorsed: true };
}

// --- Appeal votes (up/down, net score) ---

// Net score (sum of +1/-1) for a set of appeals.
export async function appealScoresFor(
  appealIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (appealIds.length === 0) return map;
  const { data, error } = await supabase
    .from("appealVotes")
    .select("appealId, value")
    .in("appealId", appealIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    map.set(row.appealId, (map.get(row.appealId) ?? 0) + (row.value ?? 0));
  }
  return map;
}

export async function appealScore(appealId: string): Promise<number> {
  const { data, error } = await supabase
    .from("appealVotes")
    .select("value")
    .eq("appealId", appealId);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, r) => sum + (r.value ?? 0), 0);
}

// The user's vote direction (+1/-1) per appeal.
export async function userVotesMap(userId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("appealVotes")
    .select("appealId, value")
    .eq("userId", userId);
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.appealId, row.value ?? 0);
  return map;
}

export async function userVote(
  appealId: string,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("appealVotes")
    .select("value")
    .eq("appealId", appealId)
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? 0;
}

// Set the user's vote to `value` (+1/-1). Clicking the same direction again
// clears it (toggle off); the opposite direction switches it.
export async function setAppealVote(
  appealId: string,
  userId: string,
  value: number,
): Promise<void> {
  const { data: existing, error } = await supabase
    .from("appealVotes")
    .select("id, value")
    .eq("appealId", appealId)
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (existing) {
    if (existing.value === value) {
      const res = await supabase
        .from("appealVotes")
        .delete()
        .eq("id", existing.id);
      if (res.error) throw new Error(res.error.message);
      return;
    }
    const res = await supabase
      .from("appealVotes")
      .update({ value })
      .eq("id", existing.id);
    if (res.error) throw new Error(res.error.message);
    return;
  }
  const res = await supabase.from("appealVotes").insert({
    id: randomUUID(),
    appealId,
    userId,
    value,
    createdAt: Date.now(),
  });
  if (res.error) throw new Error(res.error.message);
}
