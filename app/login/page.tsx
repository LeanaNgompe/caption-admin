"use client";

// this page depends on runtime configuration (env vars) and is
// inherently interactive, so avoid static prerendering to keep builds
// from trying to construct a Supabase client with missing values.
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  // initialize the client lazily on the client only; the check for
  // `typeof window !== 'undefined'` ensures nothing runs during the
  // build/prerender phase (which is what blew up earlier when the env
  // variables were missing).
  const supabase: SupabaseClient | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // don't throw; just return null and guard callers below.
      console.warn("Supabase URL/KEY missing at runtime");
      return null;
    }
    return createClient(url, key);
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "/auth/callback",
          // You may include the client ID if you really need to override
          // what is configured in the Supabase dashboard:
          queryParams: {
            client_id:
              "388960353527-fh4grc6mla425lg0e3g1hh67omtrdihd.apps.googleusercontent.com",
          },
        },
      });
    } catch (err) {
      console.error("login error", err);
    }
  };

  // If user somehow lands here already signed in we can redirect away.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace("/");
    });
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={signInWithGoogle}
      >
        Continue with Google
      </button>
    </div>
  );
}
