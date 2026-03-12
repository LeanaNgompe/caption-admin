import ContentManager from "@/components/admin/ContentManager"

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Content Management</h1>
      <p className="text-slate-500">Manage caption requests, examples, and the slang dictionary.</p>
      <ContentManager />
    </div>
  )
}
