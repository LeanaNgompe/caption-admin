"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { FileText, Plus, Trash2, Edit2, Save, HelpCircle, Book } from "lucide-react"

interface CaptionRequest {
  id: number;
  profile_id: string;
  image_id: string;
  created_datetime_utc: string;
  images?: { url: string };
}

interface CaptionExample {
  id: number;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string;
  images?: { url: string };
}

interface Term {
  id: number;
  term: string;
  definition: string;
  example: string;
  priority: number;
}

export default function ContentManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [requests, setRequests] = useState<CaptionRequest[]>([])
  const [examples, setExamples] = useState<CaptionExample[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)

  const [editingExample, setEditingExample] = useState<Partial<CaptionExample> | null>(null)
  const [editingTerm, setEditingTerm] = useState<Partial<Term> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [reqsRes, exRes, termsRes] = await Promise.all([
      supabase.from("caption_requests").select("*, images(url)").order("created_datetime_utc", { ascending: false }).limit(20),
      supabase.from("caption_examples").select("*, images(url)").order("priority", { ascending: false }),
      supabase.from("terms").select("*").order("priority", { ascending: false })
    ])

    if (reqsRes.data) setRequests(reqsRes.data)
    if (exRes.data) setExamples(exRes.data)
    if (termsRes.data) setTerms(termsRes.data)
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers for Examples
  const handleSaveExample = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExample) return
    const { id, images: _, ...data } = editingExample as any
    let res
    if (id) {
      res = await supabase.from("caption_examples").update(data).eq("id", id)
    } else {
      res = await supabase.from("caption_examples").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingExample(null); fetchData(); }
  }

  const handleDeleteExample = async (id: number) => {
    if (!confirm("Delete example?")) return
    const { error } = await supabase.from("caption_examples").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  // Handlers for Terms
  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTerm) return
    const { id, ...data } = editingTerm
    let res
    if (id) {
      res = await supabase.from("terms").update(data).eq("id", id)
    } else {
      res = await supabase.from("terms").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingTerm(null); fetchData(); }
  }

  const handleDeleteTerm = async (id: number) => {
    if (!confirm("Delete term?")) return
    const { error } = await supabase.from("terms").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Content...</div>

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Caption Requests Section */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-amber-500" />
          Recent Caption Requests
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Image</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Requested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      {r.images?.url ? <img src={r.images.url} alt="Requested" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-400">{r.profile_id.substring(0, 8)}...</td>
                  <td className="p-4 text-right text-sm text-slate-500">{new Date(r.created_datetime_utc).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption Examples Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            Caption Examples
          </h2>
          <button onClick={() => setEditingExample({})} className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Example
          </button>
        </div>
        <div className="space-y-6">
          {examples.map(ex => (
            <div key={ex.id} className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm group relative">
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                  {ex.images?.url ? <img src={ex.images.url} alt="Example" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">No Image</div>}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Example #{ex.id}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingExample(ex)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExample(ex.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="font-bold text-slate-800 italic">&quot;{ex.caption}&quot;</p>
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-400">Context:</span> {ex.image_description}</p>
                  <p className="text-sm text-slate-500 italic"><span className="font-bold text-slate-400">Why it works:</span> {ex.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Book className="w-6 h-6 text-purple-500" />
            Slang & Terms
          </h2>
          <button onClick={() => setEditingTerm({})} className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Term
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {terms.map(t => (
            <div key={t.id} className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800">{t.term}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingTerm(t)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteTerm(t.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2"><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Definition:</span>{t.definition}</p>
              <p className="text-sm text-slate-500 italic"><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Example:</span>{t.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {(editingExample || editingTerm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => { setEditingExample(null); setEditingTerm(null); }}>
          <div className="glass-panel p-8 w-full max-w-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {editingExample ? (
              <form onSubmit={handleSaveExample} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">{editingExample.id ? "Edit Example" : "Add Example"}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Caption</label>
                    <textarea value={editingExample.caption || ""} onChange={e => setEditingExample({...editingExample, caption: e.target.value})} className="w-full glass-input h-20" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Image Description</label>
                    <textarea value={editingExample.image_description || ""} onChange={e => setEditingExample({...editingExample, image_description: e.target.value})} className="w-full glass-input h-20" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Explanation</label>
                    <textarea value={editingExample.explanation || ""} onChange={e => setEditingExample({...editingExample, explanation: e.target.value})} className="w-full glass-input h-20" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Image ID (UUID)</label>
                    <input type="text" value={editingExample.image_id || ""} onChange={e => setEditingExample({...editingExample, image_id: e.target.value})} className="w-full glass-input" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                    <input type="number" value={editingExample.priority || 0} onChange={e => setEditingExample({...editingExample, priority: parseInt(e.target.value)})} className="w-full glass-input" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingExample(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveTerm} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">{editingTerm?.id ? "Edit Term" : "Add Term"}</h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Term</label>
                  <input type="text" value={editingTerm?.term || ""} onChange={e => setEditingTerm({...editingTerm, term: e.target.value})} className="w-full glass-input" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Definition</label>
                  <textarea value={editingTerm?.definition || ""} onChange={e => setEditingTerm({...editingTerm, definition: e.target.value})} className="w-full glass-input h-20" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Example Usage</label>
                  <textarea value={editingTerm?.example || ""} onChange={e => setEditingTerm({...editingTerm, example: e.target.value})} className="w-full glass-input h-20" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                  <input type="number" value={editingTerm?.priority || 0} onChange={e => setEditingTerm({...editingTerm, priority: parseInt(e.target.value)})} className="w-full glass-input" />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingTerm(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
