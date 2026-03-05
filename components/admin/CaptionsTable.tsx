import { createClient } from "@/lib/supabase/server"
import { Check, X, FileText } from "lucide-react"

export default async function CaptionsTable() {
  const supabase = await createClient()

  const { data: captions, error } = await supabase
    .from("captions")
    .select("*, images(url)")
    .order("created_datetime_utc", { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500 text-center glass-panel">Error loading captions: {error.message}</div>
  }

  const formatBool = (val: boolean) => (
    val ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3 mr-1" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
        <X className="w-3 h-3 mr-1" /> No
      </span>
    )
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-500" />
          Captions
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Image</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Content</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Public</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Featured</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Likes</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profile ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {captions?.map((cap) => (
                <tr key={cap.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-105">
                      {cap.images?.url ? (
                        <img src={cap.images.url} alt="Image" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-700 font-medium line-clamp-2 italic">"{cap.content}"</p>
                  </td>
                  <td className="p-4 text-center">{formatBool(cap.is_public)}</td>
                  <td className="p-4 text-center">{formatBool(cap.is_featured)}</td>
                  <td className="p-4 text-right">
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">
                      {cap.like_count}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {cap.profile_id.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500">
                    {cap.created_datetime_utc ? new Date(cap.created_datetime_utc).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
