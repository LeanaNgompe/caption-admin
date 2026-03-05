"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace("/hello");
    });
  }, [router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>
    </div>
  );
}