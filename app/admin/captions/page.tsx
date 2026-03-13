import CaptionsTable from "@/components/admin/CaptionsTable"

export default function CaptionsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Captions Management</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage all generated captions across the platform.</p>
      </div>
      <CaptionsTable />
    </div>
  )
}
