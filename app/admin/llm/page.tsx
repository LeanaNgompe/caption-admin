import LLMManager from "@/components/admin/LLMManager"

export default function LLMPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LLM Configuration</h1>
      <p className="text-slate-500">Manage AI models, providers, and monitor prompt chains and responses.</p>
      <LLMManager />
    </div>
  )
}
