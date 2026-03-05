import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function IndexPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // If session exists, we should check if they are an admin before redirecting to admin
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", session.user.id).single()

  if (profile?.is_superadmin) {
    redirect("/admin")
  } else {
    redirect("/hello")
  }
}
