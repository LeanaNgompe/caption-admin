"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Database, Plus, Edit2, Trash2, Save, Box, Send, MessageSquare, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react"

interface LLMModel {
  id: number;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  llm_providers?: { name: string };
}

interface LLMProvider {
  id: number;
  name: string;
}

interface LLMPromptChain {
  id: number;
  created_datetime_utc: string;
  caption_requests?: {
    images?: {
      url: string;
      image_description: string;
    }
  };
  captions?: {
    caption: string;
  }[];
}

interface LLMResponse {
  id: number;
  model_id: number;
  prompt_chain_id: number;
  response_text: string;
  llm_models?: { name: string };
}

export default function LLMManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [models, setModels] = useState<LLMModel[]>([])
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [chains, setChains] = useState<LLMPromptChain[]>([])
  const [responses, setResponses] = useState<LLMResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [chainPage, setChainPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 20

  const [editingModel, setEditingModel] = useState<Partial<LLMModel> | null>(null)
  const [editingProvider, setEditingProvider] = useState<Partial<LLMProvider> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Fetch Models & Providers (Independent)
      const [modelsRes, providersRes, responsesRes] = await Promise.all([
        supabase.from("llm_models").select("*, llm_providers(name)").order("id"),
        supabase.from("llm_providers").select("*").order("id"),
        supabase.from("llm_model_responses").select("*, llm_models(name)").order("id", { ascending: false }).limit(20)
      ])

      if (modelsRes.data) setModels(modelsRes.data as any)
      if (providersRes.data) setProviders(providersRes.data)
      if (responsesRes.data) setResponses(responsesRes.data as any)

      // 2. Fetch Prompt Chains with simplified join
      // Based on diagnostic: pc.caption_request_id -> cr.id, cr.image_id -> img.id
      const chainsRes = await supabase.from("llm_prompt_chains")
        .select(`
          id, 
          created_datetime_utc, 
          caption_requests (
            images (
              url,
              image_description
            )
          ),
          captions (
            caption
          )
        `)
        .order("id", { ascending: false })
        .range(chainPage * pageSize, (chainPage + 1) * pageSize - 1)

      if (chainsRes.error) {
        console.error("Chains complex fetch error:", chainsRes.error)
        
        // Fallback to simple query to ensure UI isn't empty
        const fallback = await supabase.from("llm_prompt_chains")
          .select("id, created_datetime_utc")
          .order("id", { ascending: false })
          .range(chainPage * pageSize, (chainPage + 1) * pageSize - 1)
        
        if (fallback.data) {
          setChains(fallback.data as any)
          setError(`Join Error: ${chainsRes.error.message}. Showing simplified list.`)
        } else if (fallback.error) {
          setError(`Fatal Error: ${fallback.error.message}`)
        }
      } else if (chainsRes.data) {
        setChains(chainsRes.data as any)
      }

    } catch (e: any) {
      setError(`System Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, chainPage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers for Models
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel) return
    const { id, llm_providers: _, ...data } = editingModel as any
    let res
    if (id) {
      res = await supabase.from("llm_models").update(data).eq("id", id)
    } else {
      res = await supabase.from("llm_models").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingModel(null); fetchData(); }
  }

  const handleDeleteModel = async (id: number) => {
    if (!confirm("Delete model?")) return
    const { error } = await supabase.from("llm_models").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  // Handlers for Providers
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProvider) return
    const { id, ...data } = editingProvider
    let res
    if (id) {
      res = await supabase.from("llm_providers").update(data).eq("id", id)
    } else {
      res = await supabase.from("llm_providers").insert([data])
    }
    if (res.error) alert(res.error.message)
    else { setEditingProvider(null); fetchData(); }
  }

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("Delete provider?")) return
    const { error } = await supabase.from("llm_providers").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  if (loading && chains.length === 0) return (
    <div className="p-12 text-center space-y-4">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
      <p className="text-slate-400 font-medium animate-pulse">Synchronizing LLM Settings...</p>
    </div>
  )

  return (
    <div className="space-y-12 animate-fade-in-up">
      {error && (
        <div className="bg-rose-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <p className="font-medium flex-1">{error}</p>
          <button onClick={() => fetchData()} className="bg-white/50 px-3 py-1 rounded-lg hover:bg-white transition-colors font-bold text-xs uppercase tracking-wider">Retry</button>
        </div>
      )}

      {/* Providers Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Box className="w-6 h-6 text-blue-500" />
            LLM Providers
          </h2>
          <button onClick={() => setEditingProvider({})} className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => (
            <div key={p.id} className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 text-lg">{p.name}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingProvider(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteProvider(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-100 px-2 py-1 rounded-full">ID: {p.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Models Section */}
      <div className="glass-panel p-8 border-l-4 border-purple-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-purple-500" />
            LLM Models
          </h2>
          <button onClick={() => setEditingModel({})} className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Model
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Model Name</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identifier</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-bold text-slate-700">{m.name}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{m.provider_model_id}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">
                      {m.llm_providers?.name || `ID: ${m.llm_provider_id}`}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingModel(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteModel(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prompt Chains Section */}
      <div className="glass-panel p-8 border-l-4 border-amber-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Send className="w-6 h-6 text-amber-500" />
            Prompt Chains
          </h2>
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl">
            <button 
              onClick={() => setChainPage(prev => Math.max(0, prev - 1))}
              disabled={chainPage === 0}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2 min-w-[80px] text-center uppercase tracking-widest">Page {chainPage + 1}</span>
            <button 
              onClick={() => setChainPage(prev => prev + 1)}
              disabled={chains.length < pageSize}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Context</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Output Sample</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chains.map((chain) => {
                const req = Array.isArray(chain.caption_requests) ? chain.caption_requests[0] : chain.caption_requests;
                const img = req?.images;
                const imageUrl = Array.isArray(img) ? img[0]?.url : img?.url;
                const imageDesc = Array.isArray(img) ? img[0]?.image_description : img?.image_description;
                const sample = Array.isArray(chain.captions) && chain.captions.length > 0 ? chain.captions[0].caption : null;

                return (
                  <tr key={chain.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">#{chain.id}</td>
                    <td className="p-4">
                      {imageUrl ? (
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white shadow-md relative group/img shrink-0 ring-4 ring-slate-50">
                            <img src={imageUrl} alt="Context" className="w-full h-full object-cover" />
                            <a href={imageUrl} target="_blank" className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                          </div>
                          {imageDesc && <p className="text-[11px] text-slate-500 italic leading-snug line-clamp-3 max-w-[180px]">{imageDesc}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 italic text-xs">
                          <ImageIcon className="w-4 h-4" />
                          <span>No Image Linked</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {sample ? (
                        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm max-w-xl group-hover:border-blue-100 group-hover:bg-white transition-all">
                          <p className="text-sm text-slate-700 font-bold italic leading-relaxed font-serif">
                            "{sample}"
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 italic text-xs">
                          <MessageSquare className="w-4 h-4" />
                          <span>Waiting for results...</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                      {new Date(chain.created_datetime_utc).toLocaleDateString()}
                      <br />
                      {new Date(chain.created_datetime_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {chains.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <div className="space-y-2">
                      <Send className="w-12 h-12 text-slate-200 mx-auto" />
                      <p className="text-slate-400 font-medium">No prompt chains found in history</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responses (Read Only) */}
      <div className="glass-panel p-8 border-l-4 border-emerald-500">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-emerald-500" />
          Recent Model Responses
        </h2>
        <div className="space-y-4">
          {responses.map(resp => (
            <div key={resp.id} className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Model: <span className="text-slate-900">{resp.llm_models?.name || resp.model_id}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-1 rounded">Chain #{resp.prompt_chain_id}</span>
              </div>
              <div className="bg-slate-900/5 p-4 rounded-xl font-mono text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                {resp.response_text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {(editingModel || editingProvider) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => { setEditingModel(null); setEditingProvider(null); }}>
          <div className="glass-panel p-8 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {editingModel ? (
              <form onSubmit={handleSaveModel} className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">{editingModel.id ? "Edit Model" : "Add Model"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Model Name</label>
                    <input type="text" value={editingModel.name || ""} onChange={e => setEditingModel({...editingModel, name: e.target.value})} className="w-full glass-input" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Model Identifier (provider_model_id)</label>
                    <input type="text" value={editingModel.provider_model_id || ""} onChange={e => setEditingModel({...editingModel, provider_model_id: e.target.value})} className="w-full glass-input" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Provider ID (llm_provider_id)</label>
                    <input type="number" value={editingModel.llm_provider_id || ""} onChange={e => setEditingModel({...editingModel, llm_provider_id: parseInt(e.target.value)})} className="w-full glass-input" required />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingModel(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-purple-600 hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveProvider} className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">{editingProvider?.id ? "Edit Provider" : "Add Provider"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Provider Name</label>
                    <input type="text" value={editingProvider?.name || ""} onChange={setEditingProvider && (e => setEditingProvider({...editingProvider, name: e.target.value}))} className="w-full glass-input" required />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setEditingProvider(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                  <button type="submit" className="glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
