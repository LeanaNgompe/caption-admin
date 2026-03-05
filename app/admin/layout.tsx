import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  // Check session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  // Check profile
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", session.user.id).single()

  if (!profile?.is_superadmin) redirect("/")

  return <>{children}</>
}

