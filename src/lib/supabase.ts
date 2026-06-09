// Server-only Supabase client using the service role key.
//
// All database access in this app happens on the server (Server Components and
// Server Actions), and the app enforces its own auth via signed cookies, so we
// use the service role key here. NEVER import this from a Client Component — the
// service role key bypasses Row Level Security and must stay on the server.
//
// The client is created lazily on first use so that a missing env var surfaces
// as a clear runtime error rather than crashing the build at import time.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local " +
        "(local) and in your Vercel project's Environment Variables (Production " +
        "+ Preview), then redeploy.",
    );
  }
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Proxy so existing `supabase.from(...)` calls keep working, but the underlying
// client isn't constructed until the first property access at request time.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
