// One-off: copy the local .data/db.json store into Supabase.
// Run AFTER applying supabase/schema.sql:  node scripts/migrate-local-to-supabase.mjs
//
// Idempotent — uses upsert on primary keys, so it's safe to re-run.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
    }
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

if (!existsSync(".data/db.json")) {
  console.log("No .data/db.json found — nothing to migrate.");
  process.exit(0);
}

const db = JSON.parse(readFileSync(".data/db.json", "utf8"));
const tables = ["users", "appeals", "comments", "candidates", "endorsements"];

// bigint columns can't take floats — coerce timestamp fields to integers.
const intFields = ["createdAt", "editedAt"];
function sanitize(row) {
  const out = { ...row };
  for (const f of intFields) {
    if (typeof out[f] === "number") out[f] = Math.floor(out[f]);
  }
  return out;
}

for (const table of tables) {
  const rows = (db[table] ?? []).map(sanitize);
  if (rows.length === 0) {
    console.log(`${table}: 0 rows`);
    continue;
  }
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`${table}: ERROR — ${error.message}`);
    process.exit(1);
  }
  console.log(`${table}: ${rows.length} rows migrated`);
}
console.log("Done.");
