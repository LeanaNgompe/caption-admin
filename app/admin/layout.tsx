import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, fetchProfile } from "@/lib/supabase";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await fetchProfile(user.id);
  if (!profile?.is_superadmin) redirect("/");

  return <>{children}</>;
}
