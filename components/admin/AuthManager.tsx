"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Plus, Trash2, Edit2, Save, Globe, Mail } from "lucide-react"

interface AllowedDomain {
  id: number;
  apex_domain: string;
  created_datetime_utc: string;
}

interface WhitelistedEmail {
  id: number;
  email_address: string;
  created_datetime_utc: string;
}

export default function AuthManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [domains, setDomains] = useState<AllowedDomain[]>([])
  const [emails, setEmails] = useState<WhitelistedEmail[]>([])
  const [loading, setLoading] = useState(true)

  const [editingDomain, setEditingDomain] = useState<Partial<AllowedDomain> | null>(null)
  const [editingEmail, setEditingEmail] = useState<Partial<WhitelistedEmail> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [domainsRes, emailsRes] = await Promise.all([
      supabase.from("allowed_signup_domains").select("*").order("apex_domain"),
      supabase.from("whitelist_email_addresses").select("*").order("email_address")
    ])

    if (domainsRes.data) setDomains(domainsRes.data)
    if (emailsRes.data) setEmails(emailsRes.data)
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers for Domains
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDomain) return
    const { id, ...data } = editingDomain
    let res
    if (id) {
      res = await supabase.from("allowed_signup_domains").update(data).eq("id", id)
    } else {
      res = await supabase.from("allowed_signup_domains").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingDomain(null); fetchData(); }
  }

  const handleDeleteDomain = async (id: number) => {
    if (!confirm("Delete domain?")) return
    const { error } = await supabase.from("allowed_signup_domains").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  // Handlers for Emails
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmail) return
    const { id, ...data } = editingEmail
    let res
    if (id) {
      res = await supabase.from("whitelist_email_addresses").update(data).eq("id", id)
    } else {
      res = await supabase.from("whitelist_email_addresses").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingEmail(null); fetchData(); }
  }

  const handleDeleteEmail = async (id: number) => {
    if (!confirm("Delete email?")) return
    const { error } = await supabase.from("whitelist_email_addresses").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Auth Settings...</div>

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Domains Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" />
            Allowed Signup Domains
          </h2>
          <button onClick={() => setEditingDomain({})} className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Domain
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map(d => (
            <div key={d.id} className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm flex justify-between items-center group">
              <span className="font-bold text-slate-700">{d.apex_domain}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingDomain(d)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-4" /></button>
                <button onClick={() => handleDeleteDomain(d.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emails Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Mail className="w-6 h-6 text-purple-500" />
            Whitelisted Emails
          </h2>
          <button onClick={() => setEditingEmail({})} className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Email
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map(e => (
            <div key={e.id} className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm flex justify-between items-center group">
              <span className="font-bold text-slate-700">{e.email_address}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingEmail(e)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-4" /></button>
                <button onClick={() => handleDeleteEmail(e.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {(editingDomain || editingEmail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => { setEditingDomain(null); setEditingEmail(null); }}>
          <div className="glass-panel p-8 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {editingDomain ? (
              <form onSubmit={handleSaveDomain} className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">{editingDomain.id ? "Edit Domain" : "Add Domain"}</h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Apex Domain</label>
                  <input type="text" placeholder="example.com" value={editingDomain.apex_domain || ""} onChange={e => setEditingDomain({...editingDomain, apex_domain: e.target.value})} className="w-full glass-input" required />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingDomain(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveEmail} className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">{editingEmail?.id ? "Edit Email" : "Add Email"}</h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input type="email" placeholder="user@example.com" value={editingEmail?.email_address || ""} onChange={e => setEditingEmail({...editingEmail, email_address: e.target.value})} className="w-full glass-input" required />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingEmail(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
