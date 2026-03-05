import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// create a normal client for server-side usage.  We don't need any special
// options since the global `fetch` is already available in Node; the
// resulting instance will simply talk to Supabase using standard HTTP.
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey);
}

// helper to get the current user, or `null` if not authenticated.
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();

  // attempt to get session based on cookies.  `cookies()` returns a promise
  // type in the current Next version so we await it.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

export async function fetchProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as { is_superadmin?: boolean } | null;
}