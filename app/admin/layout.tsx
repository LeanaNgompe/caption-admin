import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Navbar from "@/components/admin/Navbar"

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-50 mix-blend-overlay"></div>
      <Navbar />
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}
