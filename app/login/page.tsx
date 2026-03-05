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
        options: { redirectTo: "/auth/callback" },
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
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Continue with Google
      </button>
    </div>
  );
}

