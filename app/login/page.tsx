"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const signInWithGoogle = async () => {
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
