import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelloPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">
        Welcome, {session.user.email}!
      </h1>
    </div>
  );
}