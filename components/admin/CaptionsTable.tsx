import { createClient } from "@/lib/supabase/server"

export default async function CaptionsTable() {
  const supabase = await createClient()

  const { data: captions, error } = await supabase.from("captions").select("*").order("created_at", { ascending: false })

  if (error) {
    return <div>Error loading captions: {error.message}</div>
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px" }}>
      <h2>Captions</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Caption Text</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Image ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Created At</th>
          </tr>
        </thead>
        <tbody>
          {captions?.map((cap) => (
            <tr key={cap.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{cap.caption_text}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{cap.image_id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{new Date(cap.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
