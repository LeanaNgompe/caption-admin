"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function ImagesManager() {
  const supabase = createBrowserClient()
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newImageUrl, setNewImageUrl] = useState("")
  const [editingImage, setEditingImage] = useState<any>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("images").select("*").order("created_at", { ascending: false })
    if (error) setError(error.message)
    else setImages(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImageUrl) return
    const { error } = await supabase.from("images").insert([{ image_url: newImageUrl }])
    if (error) alert(error.message)
    else {
      setNewImageUrl("")
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
    const { error } = await supabase.from("images").update({ image_url: editingImage.image_url }).eq("id", editingImage.id)
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
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          style={{ padding: "8px", width: "300px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px" }}>
          Create
        </button>
      </form>

      {editingImage && (
        <form onSubmit={handleUpdate} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f9f9f9" }}>
          <h3>Edit Image</h3>
          <input
            type="text"
            value={editingImage.image_url}
            onChange={(e) => setEditingImage({ ...editingImage, image_url: e.target.value })}
            style={{ padding: "8px", width: "300px" }}
          />
          <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px" }}>
            Save
          </button>
          <button type="button" onClick={() => setEditingImage(null)} style={{ padding: "8px 16px", marginLeft: "10px" }}>
            Cancel
          </button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Image URL</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Created At</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <tr key={img.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{img.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{img.image_url}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{new Date(img.created_at).toLocaleString()}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <button onClick={() => setEditingImage(img)} style={{ marginRight: "10px" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(img.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
