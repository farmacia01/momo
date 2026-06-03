import "server-only";

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for Server Components. Reads the session from cookies.
 */
export const createServerClient = () =>
  createServerComponentClient({ cookies });

/**
 * Supabase client for Route Handlers (app/api/**). Can read and write cookies,
 * so it is the right choice for auth flows inside `app/api`.
 */
export const createRouteClient = () =>
  createRouteHandlerClient({ cookies });

/**
 * Privileged client using the service role key. Bypasses Row Level Security —
 * NEVER import this into client code. Use only in server-side jobs / webhooks.
 */
export const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
