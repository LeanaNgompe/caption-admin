import { ReactNode } from "react";
import { redirect } from "next/navigation";

// The admin layout is a server component that wraps every page under /admin.
// It performs security checks before rendering children:
//   1. get the currently authenticated user
//   2. if there's no user, redirect to the login page
//   3. load the user's profile from the database
//   4. if the profile isn't marked as a super‑admin, redirect away
//   5. otherwise render `children` normally
//
// The actual implementation details (Supabase, NextAuth, etc.) are left
// for the application.  At the moment this file contains simple stubs with
// TODO comments so that you can wire it up to whatever backend you choose.

// ---------------------------------------------------------------------------
// the shared helpers already handle user/session retrieval.
// running inside the root layout means these will always be defined, but
// we still repeat the checks locally here for defense-in-depth in case the
// admin path is accessed separately.
import { getCurrentUser, fetchProfile } from "../../lib/supabase";

// ---------------------------------------------------------------------------
// previous helper types left here for clarity
// ---------------------------------------------------------------------------

interface User {
  id: string;
  email?: string;
  // other fields from your auth system
}

interface Profile {
  is_superadmin?: boolean;
  // any other profile columns you need
}

// ---------------------------------------------------------------------------

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // rely on the same helpers as the root layout;
  // this code is effectively redundant but it ensures the /admin subtree
  // cannot be entered via a direct fetch bypass.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await fetchProfile(user.id);
  if (!profile?.is_superadmin) redirect("/");

  return <>{children}</>;
}
