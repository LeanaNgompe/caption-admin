import UsersTable from "@/components/admin/UsersTable"

export default function UsersPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage user profiles, view activity, and handle account status.</p>
      </div>
      <UsersTable />
    </div>
  )
}
