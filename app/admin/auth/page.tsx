import AuthManager from "@/components/admin/AuthManager"

export default function AuthPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h1>
      <p className="text-slate-500">Manage allowed email domains and specific whitelisted users.</p>
      <AuthManager />
    </div>
  )
}
