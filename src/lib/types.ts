// Shared data types for the protest board.
// `Public*` types are safe to send to the client; the `Stored*` types keep
// secrets (password hashes, session secrets) server-side only.

export type PublicUser = {
  id: string;
  handle: string;
  /** Whether this account is protected by a passphrase (can log back in). */
  protected: boolean;
  createdAt: number;
};

export type StoredUser = PublicUser & {
  /** scrypt hash as `salt:hash`, or null for throwaway anonymous accounts. */
  passHash: string | null;
  /** Random secret used to validate the session cookie. */
  secret: string;
};

export type Appeal = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: number;
  editedAt?: number;
};

// A person who has stepped up to represent the protest. One per user.
export type Candidate = {
  id: string;
  userId: string;
  statement: string;
  /** Which need they champion: a category key, or "general". */
  categoryKey: string;
  createdAt: number;
  editedAt?: number;
};

// A backing of a candidate. One per (candidate, user).
export type Endorsement = {
  id: string;
  candidateId: string;
  userId: string;
  createdAt: number;
};

export type Comment = {
  id: string;
  appealId: string;
  authorId: string;
  /** id of the comment this is a reply to, or null for a top-level comment. */
  parentId: string | null;
  body: string;
  createdAt: number;
  editedAt?: number;
  /** Tombstone: kept (with body cleared) when a deleted comment still has replies. */
  deleted?: boolean;
};
