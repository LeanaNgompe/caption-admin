import { createClient } from "@/lib/supabase/server"
import { Users, Mail, Shield, Clock, User, CheckCircle, XCircle, Database } from "lucide-react"

export default async function UsersTable() {
  const supabase = await createClient()

  const { data: users, error } = await supabase.from("profiles").select("*")

  if (error) {
    return <div className="p-8 text-red-500 text-center glass-panel">Error loading users: {error.message}</div>
  }

  const formatBool = (val: boolean) => (
    val ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <XCircle className="w-3 h-3 mr-1" /> No
      </span>
    )
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          Users Directory
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Roles</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {user.first_name || user.last_name ? 
                          `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
                          <span className="text-slate-400 italic">Unknown Name</span>
                        }
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 mt-1 select-all">
                        ID: {user.id.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-600 font-medium">{user.email || "No email"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      {user.is_superadmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200 w-fit">
                          <Shield className="w-3 h-3 mr-1" /> Superadmin
                        </span>
                      )}
                      {user.is_matrix_admin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 w-fit">
                          <Database className="w-3 h-3 mr-1" /> Matrix Admin
                        </span>
                      )}
                      {!user.is_superadmin && !user.is_matrix_admin && (
                        <span className="text-xs text-slate-400">Member</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">In Study</span>
                      {formatBool(user.is_in_study)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>Created: {user.created_datetime_utc ? new Date(user.created_datetime_utc).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Modified: {user.modified_datetime_utc ? new Date(user.modified_datetime_utc).toLocaleDateString() : "-"}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
