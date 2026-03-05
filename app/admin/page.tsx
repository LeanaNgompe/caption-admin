import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StatsPanel from "@/components/admin/StatsPanel"
import UsersTable from "@/components/admin/UsersTable"
import ImagesManager from "@/components/admin/ImagesManager"
import CaptionsTable from "@/components/admin/CaptionsTable"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin Dashboard</h1>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
            Sign Out
          </button>
        </form>
      </div>

      <StatsPanel />
      <UsersTable />
      <ImagesManager />
      <CaptionsTable />
    </div>
  )
}
