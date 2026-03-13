"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Database, Plus, Edit2, Trash2, Save, Box, Send, MessageSquare, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Image as ImageIcon, Clock, Terminal, BarChart3, Zap, Info } from "lucide-react"

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
  // Extended info for chains
  llm_model_responses?: {
    processing_time_seconds: number;
  }[];
}

interface LLMResponse {
  id: string;
  created_datetime_utc: string;
  llm_model_response: string;
  processing_time_seconds: number;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_models?: { name: string };
  humor_flavor_steps?: { description: string };
}

export default function LLMManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [models, setModels] = useState<LLMModel[]>([])
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [chains, setChains] = useState<LLMPromptChain[]>([])
  const [responses, setResponses] = useState<LLMResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  const [chainPage, setChainPage] = useState(0)
  const [responsePage, setResponsePage] = useState(0)
  const pageSize = 20

  const [error, setError] = useState<string | null>(null)
  const [expandedText, setExpandedText] = useState<{ title: string, text: string } | null>(null)

  const [editingModel, setEditingModel] = useState<Partial<LLMModel> | null>(null)
  const [editingProvider, setEditingProvider] = useState<Partial<LLMProvider> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [modelsRes, providersRes] = await Promise.all([
        supabase.from("llm_models").select("*, llm_providers(name)").order("id"),
        supabase.from("llm_providers").select("*").order("id"),
      ])

      if (modelsRes.data) setModels(modelsRes.data as any)
      if (providersRes.data) setProviders(providersRes.data)

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
          ),
          llm_model_responses (
            processing_time_seconds
          )
        `)
        .order("id", { ascending: false })
        .range(chainPage * pageSize, (chainPage + 1) * pageSize - 1)

      if (chainsRes.data) setChains(chainsRes.data as any)
      else if (chainsRes.error) console.error("Chains error:", chainsRes.error)

      const responsesRes = await supabase.from("llm_model_responses")
        .select(`
          id,
          created_datetime_utc,
          llm_model_response,
          processing_time_seconds,
          llm_system_prompt,
          llm_user_prompt,
          llm_models ( name ),
          humor_flavor_steps ( description )
        `)
        .order("created_datetime_utc", { ascending: false })
        .range(responsePage * pageSize, (responsePage + 1) * pageSize - 1)

      if (responsesRes.data) setResponses(responsesRes.data as any)
      else if (responsesRes.error) {
        setError(`Failed to fetch responses: ${responsesRes.error.message}`)
      }

    } catch (e: any) {
      setError(`System Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, chainPage, responsePage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel) return
    const { id, llm_providers: _, ...data } = editingModel as any
    let res = id ? await supabase.from("llm_models").update(data).eq("id", id) : await supabase.from("llm_models").insert([data])
    if (res.error) alert(res.error.message)
    else { setEditingModel(null); fetchData(); }
  }

  const handleDeleteModel = async (id: number) => {
    if (!confirm("Delete model?")) return
    const { error } = await supabase.from("llm_models").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProvider) return
    const { id, ...data } = editingProvider
    let res = id ? await supabase.from("llm_providers").update(data).eq("id", id) : await supabase.from("llm_providers").insert([data])
    if (res.error) alert(res.error.message)
    else { setEditingProvider(null); fetchData(); }
  }

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("Delete provider?")) return
    const { error } = await supabase.from("llm_providers").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  if (loading && chains.length === 0 && responses.length === 0) return (
    <div className="p-12 text-center space-y-4">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
      <p className="text-slate-400 font-medium">Initializing LLM Manager...</p>
    </div>
  )

  return (
    <div className="space-y-12 animate-fade-in-up pb-24">
      {error && (
        <div className="bg-rose-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <p className="font-medium flex-1">{error}</p>
          <button onClick={() => fetchData()} className="bg-white/50 px-3 py-1 rounded-lg hover:bg-white transition-colors font-bold text-xs uppercase tracking-wider">Retry</button>
        </div>
      )}

      {/* Providers & Models simplified view for brevity in this tool call */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Providers Section */}
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Box className="w-6 h-6 text-blue-500" />
              Providers
            </h2>
            <button onClick={() => setEditingProvider({})} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {providers.map(p => (
              <div key={p.id} className="bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm flex items-center gap-3">
                <span className="font-bold text-slate-700">{p.name}</span>
                <div className="flex gap-1 border-l border-slate-200 pl-3">
                  <button onClick={() => setEditingProvider(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteProvider(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Models Section */}
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Database className="w-6 h-6 text-purple-500" />
              Active Models
            </h2>
            <button onClick={() => setEditingModel({})} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {models.map(m => (
              <div key={m.id} className="bg-white/50 p-3 rounded-xl border border-white/60 shadow-sm flex flex-col gap-1">
                <span className="font-bold text-slate-700 text-sm truncate">{m.name}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{m.provider_model_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Chains Section */}
      <div className="glass-panel p-8 border-l-4 border-amber-500">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Send className="w-6 h-6 text-amber-500" />
              Prompt Workflow History
            </h2>
            <p className="text-xs text-slate-400 font-medium">Trace the execution of your LLM pipelines from image to final caption.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl">
            <button onClick={() => setChainPage(prev => Math.max(0, prev - 1))} disabled={chainPage === 0} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2 min-w-[80px] text-center uppercase tracking-widest">Page {chainPage + 1}</span>
            <button onClick={() => setChainPage(prev => prev + 1)} disabled={chains.length < pageSize} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flow ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Context & Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Insights</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Output</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chains.map((chain) => {
                const req = Array.isArray(chain.caption_requests) ? chain.caption_requests[0] : chain.caption_requests;
                const img = req?.images;
                const imageUrl = Array.isArray(img) ? img[0]?.url : img?.url;
                const imageDesc = Array.isArray(img) ? img[0]?.image_description : img?.image_description;
                const sample = Array.isArray(chain.captions) && chain.captions.length > 0 ? chain.captions[0].caption : null;
                
                const responses = chain.llm_model_responses || [];
                const totalProcessingTime = responses.reduce((acc, curr) => acc + (curr.processing_time_seconds || 0), 0);
                const stepsCount = responses.length;

                return (
                  <tr key={chain.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">#{chain.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white shadow-md relative group/img shrink-0 ring-4 ring-slate-50">
                          {imageUrl ? <img src={imageUrl} alt="Context" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon className="w-6 h-6" /></div>}
                          {imageUrl && <a href={imageUrl} target="_blank" className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><ExternalLink className="w-4 h-4 text-white" /></a>}
                        </div>
                        <div className="space-y-1">
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-block ${sample ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sample ? 'Success' : 'In Progress'}
                          </div>
                          {imageDesc && <p className="text-[11px] text-slate-500 italic leading-tight line-clamp-2 max-w-[150px]">{imageDesc}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <BarChart3 className="w-3 h-3 text-blue-400" />
                          {stepsCount} Pipeline Steps
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {totalProcessingTime}s Total Latency
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {sample ? (
                        <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-sm max-w-sm group-hover:border-blue-100 transition-all cursor-pointer" onClick={() => setExpandedText({ title: "Flow Result", text: sample })}>
                          <p className="text-xs text-slate-700 font-bold italic line-clamp-3">"{sample}"</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic font-medium">Awaiting completion...</span>
                      )}
                    </td>
                    <td className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                      {new Date(chain.created_datetime_utc).toLocaleDateString()}
                      <br />
                      <span className="text-slate-300 font-medium">{new Date(chain.created_datetime_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Responses Section */}
      <div className="glass-panel p-8 border-l-4 border-emerald-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            Model Response Detail
          </h2>
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl">
            <button onClick={() => setResponsePage(prev => Math.max(0, prev - 1))} disabled={responsePage === 0} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2 min-w-[80px] text-center uppercase tracking-widest">Page {responsePage + 1}</span>
            <button onClick={() => setResponsePage(prev => prev + 1)} disabled={responses.length < pageSize} className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Model</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Response</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prompts</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Time</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flavor Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {responses.map((resp) => (
                <tr key={resp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4"><span className="font-bold text-slate-700 text-sm whitespace-nowrap">{resp.llm_models?.name || "Unknown"}</span></td>
                  <td className="p-4 max-w-md">
                    <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => setExpandedText({ title: "Model Response", text: resp.llm_model_response })}>
                      <p className="text-xs text-slate-600 line-clamp-3 font-mono leading-relaxed">{resp.llm_model_response}</p>
                    </div>
                  </td>
                  <td className="p-4 space-y-2">
                    <button onClick={() => setExpandedText({ title: "System Prompt", text: resp.llm_system_prompt })} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-2 py-1 rounded transition-colors w-full"><Terminal className="w-3 h-3" /> System Prompt</button>
                    <button onClick={() => setExpandedText({ title: "User Prompt", text: resp.llm_user_prompt })} className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded transition-colors w-full"><Terminal className="w-3 h-3" /> User Prompt</button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-xs font-bold text-slate-500">{resp.processing_time_seconds}s</span>
                    </div>
                  </td>
                  <td className="p-4"><p className="text-[11px] text-slate-500 italic max-w-[150px] line-clamp-2">{resp.humor_flavor_steps?.description || "Generic Step"}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Text Modal */}
      {expandedText && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md" onClick={() => setExpandedText(null)}>
          <div className="glass-panel p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3"><Info className="w-6 h-6 text-blue-500" />{expandedText.title}</h3>
              <button onClick={() => setExpandedText(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Plus className="w-6 h-6 transform rotate-45 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{expandedText.text}</div>
          </div>
        </div>
      )}

      {/* Modals for Models & Providers */}
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
                    <input type="text" value={editingProvider?.name || ""} onChange={e => setEditingProvider && setEditingProvider({...editingProvider, name: e.target.value})} className="w-full glass-input" required />
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
