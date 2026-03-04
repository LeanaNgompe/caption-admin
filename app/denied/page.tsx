export default function DeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded border p-8 shadow">
        <h1 className="text-2xl font-semibold mb-4">Access denied</h1>
        <p>You are not an admin and cannot access this site.</p>
      </div>
    </div>
  );
}
