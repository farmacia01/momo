"use client";

import {
  createClientComponentClient,
  type SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

/**
 * Browser-side Supabase client factory.
 *
 * Uses the auth-helpers component client so the session stays in sync with the
 * cookies set on the server. Call inside Client Components / hooks.
 */
export const createBrowserClient = () => createClientComponentClient();

// Lazily-created singleton. We do NOT construct the client at module load,
// otherwise importing `supabase` would throw during SSR/prerender when the
// NEXT_PUBLIC_SUPABASE_* env vars are not set yet. The real client is built on
// first property access (which only happens in the browser / event handlers).
let _client: SupabaseClient | null = null;
const getClient = (): SupabaseClient => {
  if (!_client) _client = createClientComponentClient();
  return _client;
};

/**
 * Ready-to-use Supabase client for the browser. Backed by a lazy singleton, so
 * usage like `supabase.auth.signInWithPassword(...)` works exactly as before.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
