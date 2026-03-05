import { createClient } from "@/lib/supabase/server"

export default async function CaptionsTable() {
  const supabase = await createClient()

  const { data: captions, error } = await supabase
    .from("captions")
    .select("*, images(url)")
    .order("created_datetime_utc", { ascending: false })

  if (error) {
    return <div>Error loading captions: {error.message}</div>
  }

  const formatBool = (val: boolean) => (val ? "Yes" : "No")

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px", overflowX: "auto" }}>
      <h2>Captions</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Image Preview</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Content</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Public</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Featured</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Likes</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Profile ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Created (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {captions?.map((cap) => (
            <tr key={cap.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {cap.images?.url ? (
                  <img src={cap.images.url} alt="Image" style={{ width: "80px", height: "60px", objectFit: "cover" }} />
                ) : (
                  "No Image"
                )}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px", maxWidth: "300px" }}>{cap.content}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{formatBool(cap.is_public)}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{formatBool(cap.is_featured)}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{cap.like_count}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", fontSize: "12px" }}>{cap.profile_id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {cap.created_datetime_utc ? new Date(cap.created_datetime_utc).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
