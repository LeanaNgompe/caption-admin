"use client";

// no need to prerender this route; it just handles the OAuth fragment
// on the client and then redirects.  marking it dynamic keeps the
// build from touching Supabase during export.
export const dynamic = "force-dynamic";

import { useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Supabase will parse the URL fragment and store the session in local
    // storage / cookies.  After the promise resolves we can redirect to the
    // homepage (or wherever makes sense for your app).
    // the TS typings don't yet include `getSessionFromUrl`; cast to `any` so
    // the code compiles.
    (supabase.auth as any)
      .getSessionFromUrl({ storeSession: true })
      .then(({ error }: any) => {
        if (error) {
          console.error("Error handling callback", error);
          // In a real app you might show a message or redirect to /login
        } else {
          router.replace("/");
        }
      });
  }, [router]);

  return <p>Signing you in…</p>;
}
