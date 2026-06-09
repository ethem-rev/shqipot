// Server-only Supabase client using the service role key.
//
// All database access in this app happens on the server (Server Components and
// Server Actions), and the app enforces its own auth via signed cookies, so we
// use the service role key here. NEVER import this from a Client Component — the
// service role key bypasses Row Level Security and must stay on the server.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local " +
      "(local) and in your Vercel project's Environment Variables (deploy).",
  );
}

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
