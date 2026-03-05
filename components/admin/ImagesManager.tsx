"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Plus, Trash2, Edit2, X, Save, Image as ImageIcon } from "lucide-react"

interface Image {
  id: string;
  url: string;
  created_datetime_utc: string;
}

export default function ImagesManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [editingImage, setEditingImage] = useState<Image | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("images").select("*").order("created_datetime_utc", { ascending: false })
    if (error) {
      console.error("Fetch error:", error)
      setError(error.message)
    } else {
      setImages((data as Image[]) || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return
    
    const { data, error } = await supabase.from("images").insert([{ url: newUrl }]).select()
    
    if (error) {
      alert("Create failed: " + error.message)
    } else {
      setNewUrl("")
      fetchImages()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    const { error } = await supabase.from("images").delete().eq("id", id)
    if (error) {
      alert(error.message)
    } else {
      fetchImages()
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingImage) return
    const { error } = await supabase.from("images").update({ url: editingImage.url }).eq("id", editingImage.id)
    if (error) {
      alert(error.message)
    } else {
      setEditingImage(null)
      fetchImages()
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Images...</div>
  if (error) return <div className="p-8 text-red-500 text-center glass-panel">Error: {error}</div>

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-purple-600" />
          Image Management
        </h2>

        <form onSubmit={handleCreate} className="flex gap-4 items-end bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm backdrop-blur-md">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">New Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full glass-input"
            />
          </div>
          <button type="submit" className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mb-[2px]">
            <Plus className="w-4 h-4" />
            Add Image
          </button>
        </form>
      </div>

      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => setEditingImage(null)}>
          <div className="glass-panel p-8 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Edit Image</h3>
              <button onClick={() => setEditingImage(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Image URL</label>
                <input
                  type="text"
                  value={editingImage.url}
                  onChange={(e) => setEditingImage({ ...editingImage, url: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
              
              <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-video flex items-center justify-center">
                {editingImage.url ? (
                  <img src={editingImage.url} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-400 text-sm">No preview available</div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingImage(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/50">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Preview</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">URL</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {images.map((img) => (
              <tr key={img.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 w-24">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-105">
                    <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-400 select-all">{img.id.substring(0, 8)}...</td>
                <td className="p-4 max-w-xs">
                  <div className="truncate text-sm text-slate-600 font-medium" title={img.url}>{img.url}</div>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {img.created_datetime_utc ? new Date(img.created_datetime_utc).toLocaleDateString() : "-"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingImage(img)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(img.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
