import { createClient } from "@/lib/supabase/server"

export default async function UsersTable() {
  const supabase = await createClient()

  const { data: users, error } = await supabase.from("profiles").select("*")

  if (error) {
    return <div>Error loading users: {error.message}</div>
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px" }}>
      <h2>Users</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>User ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Profile Info</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.email}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {JSON.stringify(user, null, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
