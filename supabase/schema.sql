-- Shqipot schema. Run this once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Column names are camelCase (quoted) to match the app's TypeScript types so no
-- field mapping is needed. Timestamps are epoch milliseconds (bigint).
--
-- The app talks to these tables only with the service role key from the server,
-- so Row Level Security is left disabled. If you later expose the anon key to a
-- browser, enable RLS and add policies before doing so.

create table if not exists users (
  id uuid primary key,
  handle text not null,
  "protected" boolean not null default false,
  "passHash" text,
  secret text not null,
  "createdAt" bigint not null
);
create unique index if not exists users_handle_lower_idx on users (lower(handle));

create table if not exists appeals (
  id uuid primary key,
  "authorId" uuid not null,
  title text not null,
  body text not null,
  "createdAt" bigint not null,
  "editedAt" bigint
);
create index if not exists appeals_created_idx on appeals ("createdAt" desc);

create table if not exists comments (
  id uuid primary key,
  "appealId" uuid not null,
  "authorId" uuid not null,
  "parentId" uuid,
  body text not null,
  "createdAt" bigint not null,
  "editedAt" bigint,
  deleted boolean not null default false
);
create index if not exists comments_appeal_idx on comments ("appealId");

create table if not exists candidates (
  id uuid primary key,
  "userId" uuid not null unique,
  statement text not null,
  "categoryKey" text not null,
  "createdAt" bigint not null,
  "editedAt" bigint
);

create table if not exists endorsements (
  id uuid primary key,
  "candidateId" uuid not null,
  "userId" uuid not null,
  "createdAt" bigint not null,
  unique ("candidateId", "userId")
);
create index if not exists endorsements_candidate_idx on endorsements ("candidateId");

-- Citizen "support" upvotes on appeals (one per user per appeal).
create table if not exists "appealVotes" (
  id uuid primary key,
  "appealId" uuid not null,
  "userId" uuid not null,
  "createdAt" bigint not null,
  unique ("appealId", "userId")
);
create index if not exists appealvotes_appeal_idx on "appealVotes" ("appealId");
