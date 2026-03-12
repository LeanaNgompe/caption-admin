import HumorManager from "@/components/admin/HumorManager"

export default function HumorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Humor Settings</h1>
      <p className="text-slate-500">Manage humor flavors, mix ratios, and view flavor steps.</p>
      <HumorManager />
    </div>
  )
}
