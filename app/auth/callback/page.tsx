"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
