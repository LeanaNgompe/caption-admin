"use client";

// avoid running any Supabase logic during static exports – the prod
// build on Vercel doesn't have env vars available at build time, so
// attempting to call `createClient` causes the prerender error you saw.
// marking the page dynamic keeps Next from touching it during export.
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const supabase: SupabaseClient | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("Supabase URL/KEY missing at runtime");
      return null;
    }
    return createClient(url, key);
  }, []);

  const [configError, setConfigError] = useState<string | null>(
    supabase ? null : "Missing Supabase configuration"
  );

  const signInWithGoogle = async () => {
    if (!supabase) {
      setConfigError("Unable to initialize Supabase client");
      console.error("Supabase client not available");
      return;
    }
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo:  `${location.origin}/auth/callback` }, // callback will redirect to hello page
      });
    } catch (err) {
      console.error("login error", err);
    }
  };

  // If user somehow lands here already signed in we can redirect away.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace("/hello");
    });
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      {configError ? (
        <p className="text-red-600">{configError}</p>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Continue with Google
        </button>
      )}
    </div>
  );
}

