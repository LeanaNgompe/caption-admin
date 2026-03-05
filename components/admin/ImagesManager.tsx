"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Image {
  id: string;
  url: string;
  created_datetime_utc: string;
}

export default function ImagesManager() {
  const supabase = createBrowserClient()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [editingImage, setEditingImage] = useState<Image | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("images").select("*").order("created_datetime_utc", { ascending: false })
    if (error) setError(error.message)
    else setImages((data as Image[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return
    const { error } = await supabase.from("images").insert([{ url: newUrl }])
    if (error) alert(error.message)
    else {
      setNewUrl("")
      fetchImages()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    const { error } = await supabase.from("images").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchImages()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingImage) return
    const { error } = await supabase.from("images").update({ url: editingImage.url }).eq("id", editingImage.id)
    if (error) alert(error.message)
    else {
      setEditingImage(null)
      fetchImages()
    }
  }

  if (loading) return <div>Loading images...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px" }}>
      <h2>Images Manager</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: "20px" }}>
        <h3>Create New Image</h3>
        <input
          type="text"
          placeholder="Image URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          style={{ padding: "8px", width: "400px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px", cursor: "pointer" }}>
          Create
        </button>
      </form>

      {editingImage && (
        <form onSubmit={handleUpdate} style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9f9f9", border: "1px solid #ddd" }}>
          <h3>Edit Image</h3>
          <input
            type="text"
            value={editingImage.url}
            onChange={(e) => setEditingImage({ ...editingImage, url: e.target.value })}
            style={{ padding: "8px", width: "400px" }}
          />
          <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px", cursor: "pointer" }}>
            Save
          </button>
          <button type="button" onClick={() => setEditingImage(null)} style={{ padding: "8px 16px", marginLeft: "10px", cursor: "pointer" }}>
            Cancel
          </button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Preview</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>URL</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Created (UTC)</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <tr key={img.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <img src={img.url} alt="Preview" style={{ width: "80px", height: "60px", objectFit: "cover" }} />
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px", fontSize: "12px" }}>{img.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", maxWidth: "300px", wordBreak: "break-all" }}>{img.url}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {img.created_datetime_utc ? new Date(img.created_datetime_utc).toLocaleString() : "-"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <button onClick={() => setEditingImage(img)} style={{ marginRight: "10px", cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(img.id)} style={{ cursor: "pointer", color: "red" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
