"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Activity, Layers, Sliders, RefreshCw } from "lucide-react"

interface HumorFlavor {
  id: number;
  name: string;
  created_datetime_utc: string;
}

interface HumorFlavorStep {
  id: number;
  humor_flavor_id: number;
  step_type_id: number;
  order_index: number;
  // ... other fields?
}

interface HumorFlavorMix {
  id: number;
  humor_flavor_id: number;
  caption_count: number;
  humor_flavors?: { name: string };
}

export default function HumorManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [flavors, setFlavors] = useState<HumorFlavor[]>([])
  const [steps, setSteps] = useState<HumorFlavorStep[]>([])
  const [mix, setMix] = useState<HumorFlavorMix[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [flavorsRes, stepsRes, mixRes] = await Promise.all([
      supabase.from("humor_flavors").select("*").order("id"),
      supabase.from("humor_flavor_steps").select("*").order("humor_flavor_id, order_index"),
      supabase.from("humor_flavor_mix").select("*, humor_flavors(name)").order("id")
    ])

    if (flavorsRes.data) setFlavors(flavorsRes.data)
    if (stepsRes.data) setSteps(stepsRes.data)
    if (mixRes.data) setMix(mixRes.data)
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateMix = async (id: number, count: number) => {
    setUpdating(id)
    const { error } = await supabase.from("humor_flavor_mix").update({ caption_count: count }).eq("id", id)
    if (error) {
      alert("Update failed: " + error.message)
    } else {
      fetchData()
    }
    setUpdating(null)
  }

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Humor Settings...</div>

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Humor Flavors (Read Only) */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <Activity className="w-6 h-6 text-pink-500" />
          Humor Flavors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flavors.map(flavor => (
            <div key={flavor.id} className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm flex justify-between items-center">
              <span className="font-bold text-slate-700">{flavor.name}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-100 px-2 py-1 rounded-full">ID: {flavor.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Humor Flavor Mix (Read/Update) */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <Sliders className="w-6 h-6 text-orange-500" />
          Humor Flavor Mix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flavor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Caption Count</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mix.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-medium text-slate-700">{m.humor_flavors?.name || `Flavor ID: ${m.humor_flavor_id}`}</td>
                  <td className="p-4">
                    <input 
                      type="number" 
                      className="glass-input w-24 py-1" 
                      defaultValue={m.caption_count}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value)
                        if (val !== m.caption_count) handleUpdateMix(m.id, val)
                      }}
                    />
                  </td>
                  <td className="p-4 text-right">
                    {updating === m.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500 ml-auto" />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Auto-saves on blur</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Humor Flavor Steps (Read Only) */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight flex items-center gap-3">
          <Layers className="w-6 h-6 text-indigo-500" />
          Humor Flavor Steps
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flavor ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Order</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Step Type ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {steps.map((step) => (
                <tr key={step.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-mono text-xs text-slate-500">{step.humor_flavor_id}</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">#{step.order_index}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-medium">Step Type: {step.step_type_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
