import { createClient } from "@/lib/supabase/server"

export default async function StatsPanel() {
  const supabase = await createClient()

  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: imageCount } = await supabase.from("images").select("*", { count: "exact", head: true })
  const { count: captionCount } = await supabase.from("captions").select("*", { count: "exact", head: true })

  const { data: recentImages } = await supabase.from("images").select("*").order("created_at", { ascending: false }).limit(5)
  const { data: recentCaptions } = await supabase.from("captions").select("*").order("created_at", { ascending: false }).limit(5)

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px" }}>
      <h2>Statistics</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>Total Users: {userCount || 0}</div>
        <div>Total Images: {imageCount || 0}</div>
        <div>Total Captions: {captionCount || 0}</div>
      </div>
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div>
          <h3>Recent Images</h3>
          <ul>
            {recentImages?.map((img) => (
              <li key={img.id}>{img.image_url}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recent Captions</h3>
          <ul>
            {recentCaptions?.map((cap) => (
              <li key={cap.id}>{cap.caption_text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
