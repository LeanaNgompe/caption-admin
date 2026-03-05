import Link from "next/link"

export default function Navbar() {
  return (
    <nav style={{ 
      padding: "20px 40px", 
      borderBottom: "1px solid #ccc", 
      display: "flex", 
      gap: "20px",
      alignItems: "center",
      backgroundColor: "#f9f9f9"
    }}>
      <Link href="/admin" style={{ fontWeight: "bold", textDecoration: "none", color: "black" }}>Dashboard</Link>
      <Link href="/admin/users" style={{ textDecoration: "none", color: "#555" }}>Users</Link>
      <Link href="/admin/images" style={{ textDecoration: "none", color: "#555" }}>Images</Link>
      <Link href="/admin/captions" style={{ textDecoration: "none", color: "#555" }}>Captions</Link>
      
      <div style={{ marginLeft: "auto" }}>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid #ccc", background: "white" }}>
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  )
}
