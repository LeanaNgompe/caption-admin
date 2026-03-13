import StatsPanel from "@/components/admin/StatsPanel"

export default async function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">System overview, real-time statistics, and performance metrics.</p>
      </div>
      <StatsPanel />
    </div>
  )
}
