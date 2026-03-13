import ImagesManager from "@/components/admin/ImagesManager"

export default function ImagesPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Image Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage processed images, their descriptions, and associated metadata.</p>
      </div>
      <ImagesManager />
    </div>
  )
}
