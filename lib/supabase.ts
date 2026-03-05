import { supabase } from "./supabaseClient";

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles") // table storing user profiles
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}