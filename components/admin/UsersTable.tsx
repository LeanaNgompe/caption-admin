import { createClient } from "@/lib/supabase/server"

export default async function UsersTable() {
  const supabase = await createClient()

  const { data: users, error } = await supabase.from("profiles").select("*")

  if (error) {
    return <div>Error loading users: {error.message}</div>
  }

  const formatBool = (val: boolean) => (val ? "Yes" : "No")

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px", overflowX: 'auto' }}>
      <h2 style={{ marginBottom: "15px" }}>Users</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>First Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Last Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Superadmin</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>In Study</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Matrix Admin</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Created (UTC)</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: 'left' }}>Modified (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.first_name ?? "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.last_name ?? "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.email ?? "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{formatBool(user.is_superadmin)}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{formatBool(user.is_in_study)}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{formatBool(user.is_matrix_admin)}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {user.created_datetime_utc ? new Date(user.created_datetime_utc).toLocaleString() : "-"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {user.modified_datetime_utc ? new Date(user.modified_datetime_utc).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
