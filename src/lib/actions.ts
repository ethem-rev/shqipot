"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import {
  createAppeal as storeCreateAppeal,
  createComment as storeCreateComment,
  createUser,
  deleteAppeal as storeDeleteAppeal,
  deleteCandidate as storeDeleteCandidate,
  deleteComment as storeDeleteComment,
  getAppeal,
  getCandidate,
  getCandidateByUser,
  getComment,
  getUserByHandle,
  toggleEndorsement as storeToggleEndorsement,
  updateAppeal as storeUpdateAppeal,
  updateComment as storeUpdateComment,
  upsertCandidate,
} from "./store";
import { representChoices } from "./categories";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassphrase,
  newSecret,
  verifyPassphrase,
} from "./session";

export type FormState = { error?: string; ok?: boolean };

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,24}$/;

// Log in to an existing username, or claim a new one. A username is always
// protected by a passphrase so the same person can return later.
export async function loginWithUsername(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const handle = String(formData.get("handle") ?? "").trim();
  const passphrase = String(formData.get("passphrase") ?? "");

  if (!HANDLE_RE.test(handle)) {
    return {
      error:
        "Username must be 3–24 characters: letters, numbers, dashes or underscores.",
    };
  }
  if (passphrase.length < 6) {
    return { error: "Passphrase must be at least 6 characters." };
  }

  const existing = await getUserByHandle(handle);
  if (existing) {
    if (!existing.passHash || !verifyPassphrase(passphrase, existing.passHash)) {
      return { error: "Wrong username or passphrase." };
    }
    await createSession(existing);
  } else {
    const user = await createUser({
      handle,
      protected: true,
      passHash: hashPassphrase(passphrase),
      secret: newSecret(),
    });
    await createSession(user);
  }

  redirect("/");
}

// Create a throwaway anonymous identity with a generated handle.
export async function continueAnonymously(): Promise<void> {
  let handle = "";
  for (let i = 0; i < 5; i++) {
    const candidate = `anon-${randomBytes(4).toString("hex")}`;
    if (!(await getUserByHandle(candidate))) {
      handle = candidate;
      break;
    }
  }
  if (!handle) handle = `anon-${randomBytes(8).toString("hex")}`;

  const user = await createUser({
    handle,
    protected: false,
    passHash: null,
    secret: newSecret(),
  });
  await createSession(user);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function createAppeal(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (title.length < 3 || title.length > 120) {
    return { error: "Title must be between 3 and 120 characters." };
  }
  if (body.length < 1 || body.length > 5000) {
    return { error: "Please write your appeal (up to 5000 characters)." };
  }

  const appeal = await storeCreateAppeal({ authorId: user.id, title, body });
  revalidatePath("/");
  redirect(`/appeals/${appeal.id}`);
}

export async function createComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const appealId = String(formData.get("appealId") ?? "");
  const rawParent = String(formData.get("parentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!appealId || !(await getAppeal(appealId))) {
    return { error: "That appeal no longer exists." };
  }

  let parentId: string | null = null;
  if (rawParent) {
    const parent = await getComment(rawParent);
    if (!parent || parent.appealId !== appealId) {
      return { error: "The comment you're replying to no longer exists." };
    }
    parentId = parent.id;
  }

  if (body.length < 1 || body.length > 2000) {
    return { error: "Comment must be between 1 and 2000 characters." };
  }

  await storeCreateComment({ appealId, authorId: user.id, parentId, body });
  revalidatePath(`/appeals/${appealId}`);
  return { ok: true };
}

export async function updateAppeal(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const appeal = await getAppeal(id);
  if (!appeal) return { error: "That appeal no longer exists." };
  if (appeal.authorId !== user.id) {
    return { error: "You can only edit your own appeal." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 3 || title.length > 120) {
    return { error: "Title must be between 3 and 120 characters." };
  }
  if (body.length < 1 || body.length > 5000) {
    return { error: "Please write your appeal (up to 5000 characters)." };
  }

  await storeUpdateAppeal(id, { title, body });
  revalidatePath("/");
  revalidatePath(`/appeals/${id}`);
  return { ok: true };
}

export async function deleteAppeal(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const appeal = await getAppeal(id);
  if (appeal && appeal.authorId === user.id) {
    await storeDeleteAppeal(id);
  }
  revalidatePath("/");
  redirect("/");
}

export async function updateComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const comment = await getComment(id);
  if (!comment) return { error: "That comment no longer exists." };
  if (comment.authorId !== user.id) {
    return { error: "You can only edit your own comment." };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 2000) {
    return { error: "Comment must be between 1 and 2000 characters." };
  }

  await storeUpdateComment(id, body);
  revalidatePath(`/appeals/${comment.appealId}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const comment = await getComment(id);
  if (comment && comment.authorId === user.id) {
    await storeDeleteComment(id);
    revalidatePath(`/appeals/${comment.appealId}`);
  }
}

// --- Representatives ---

const ALLOWED_REPRESENT = new Set(representChoices().map((c) => c.key));

// Create or update the current user's candidacy to represent the protest.
export async function applyToRepresent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const statement = String(formData.get("statement") ?? "").trim();
  let categoryKey = String(formData.get("categoryKey") ?? "general");
  if (!ALLOWED_REPRESENT.has(categoryKey)) categoryKey = "general";

  if (statement.length < 10 || statement.length > 600) {
    return { error: "Your statement must be between 10 and 600 characters." };
  }

  await upsertCandidate(user.id, { statement, categoryKey });
  revalidatePath("/representatives");
  revalidatePath(`/insights/${categoryKey}`);
  return { ok: true };
}

export async function withdrawCandidacy(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const candidate = await getCandidateByUser(user.id);
  if (candidate) {
    await storeDeleteCandidate(candidate.id);
    revalidatePath("/representatives");
    revalidatePath(`/insights/${candidate.categoryKey}`);
  }
}

// Back or un-back a candidate. Called directly from the client.
export async function toggleEndorsement(candidateId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const candidate = await getCandidate(candidateId);
  if (!candidate) return;
  // No self-endorsement — legitimacy should come from others.
  if (candidate.userId === user.id) return;

  await storeToggleEndorsement(candidateId, user.id);
  revalidatePath("/representatives");
  revalidatePath(`/insights/${candidate.categoryKey}`);
}
