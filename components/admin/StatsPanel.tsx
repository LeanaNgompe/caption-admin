"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import * as d3 from "d3"
import { 
  Users, 
  Image as ImageIcon, 
  Type, 
  Activity, 
  TrendingUp, 
  BarChart3,
  Award,
  PieChart
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Helper for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Helper Types ---

interface DBImage {
  id: string
  url: string
  created_datetime_utc: string
}

interface Caption {
  id: string
  content: string
  profile_id: string
  image_id: string
  like_count: number
  created_datetime_utc: string
}

// --- Main Component ---

export default function StatsPanel() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data States
  const [counts, setCounts] = useState({ users: 0, images: 0, captions: 0, activeToday: 0 })
  const [recentData, setRecentData] = useState<{ images: DBImage[], captions: (Caption & { images?: { url: string } })[] }>({ images: [], captions: [] })
  const [analyticsData, setAnalyticsData] = useState<{
    memeBirthRate: any[],
    flavorPerformance: any[],
    modelPerformance: any[],
    ratingDistribution: any[]
  }>({ 
    memeBirthRate: [], 
    flavorPerformance: [], 
    modelPerformance: [], 
    ratingDistribution: [] 
  })
  const [networkData, setNetworkData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // 1. Basic Counts
        const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
        const { count: imageCount } = await supabase.from("images").select("*", { count: "exact", head: true })
        const { count: captionCount } = await supabase.from("captions").select("*", { count: "exact", head: true })

        // 2. Active Users Today
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const { data: activeCaptions } = await supabase
          .from("captions")
          .select("profile_id")
          .gte("created_datetime_utc", startOfToday.toISOString())
        
        const activeUsersCount = new Set(activeCaptions?.map(c => c.profile_id)).size

        setCounts({
          users: userCount || 0,
          images: imageCount || 0,
          captions: captionCount || 0,
          activeToday: activeUsersCount
        })

        // 3. Recent Items (Existing UI)
        const { data: recentImages } = await supabase.from("images").select("*").order("created_datetime_utc", { ascending: false }).limit(5)
        const { data: recentCaptions } = await supabase.from("captions").select("*, images(url)").order("created_datetime_utc", { ascending: false }).limit(5)
        
        setRecentData({
          images: (recentImages as DBImage[]) || [],
          captions: (recentCaptions as any) || []
        })

        // 4. Analytics Data
        
        // Meme Birth Rate (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data: imageDates } = await supabase
          .from("images")
          .select("created_datetime_utc")
          .gte("created_datetime_utc", thirtyDaysAgo.toISOString())
        
        const birthRateGrouped = d3.rollups(
          imageDates || [],
          v => v.length,
          d => d.created_datetime_utc?.split('T')[0]
        ).filter(([date]) => date)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

        // --- Caption Performance Analytics ---
        
        // Fetch captions with flavor and model info for aggregation
        // We limit this to a representative sample for performance if needed, but let's try a full fetch for counts first
        const { data: performanceRaw } = await supabase
          .from("captions")
          .select("like_count, humor_flavor_id, humor_flavors(slug), llm_model_responses(llm_model_id, llm_models(name))")
          // No limit for now, but in a real app you'd aggregate this on the DB side via RPC
        
        // A. Flavor Performance
        const flavorPerf = d3.rollups(
          (performanceRaw || []).filter(c => c.humor_flavors),
          v => d3.mean(v, d => d.like_count) || 0,
          d => (d.humor_flavors as any)?.slug || "Unknown"
        )
        .map(([slug, avgLikes]) => ({ slug, avgLikes }))
        .sort((a, b) => b.avgLikes - a.avgLikes)
        .slice(0, 10) // Top 10 flavors

        // B. Model Performance
        const modelPerf = d3.rollups(
          (performanceRaw || []).filter(c => c.llm_model_responses),
          v => d3.mean(v, d => d.like_count) || 0,
          d => (d.llm_model_responses as any)?.llm_models?.name || "Unknown"
        )
        .map(([name, avgLikes]) => ({ name, avgLikes }))
        .sort((a, b) => b.avgLikes - a.avgLikes)

        // C. Rating Distribution
        const ratingDist = d3.rollups(
          (performanceRaw || []),
          v => v.length,
          d => d.like_count
        )
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => a.rating - b.rating)

        setAnalyticsData({
          memeBirthRate: birthRateGrouped,
          flavorPerformance: flavorPerf,
          modelPerformance: modelPerf,
          ratingDistribution: ratingDist
        })

        // 5. Network Visualization Data
        const { data: networkNodes } = await supabase.from("captions").select("id, content, like_count, image_id").limit(100)
        
        // Gather valid image IDs
        const imageIds = (networkNodes || []).map((c: any) => c.image_id).filter(Boolean)
        
        // Fetch corresponding images
        const { data: allImages } = await supabase.from("images").select("id, url").in("id", imageIds)

        const nodes: any[] = []
        const links: any[] = []
        const imageNodeIds = new Set<string>()

        allImages?.forEach(img => {
          nodes.push({ id: img.id, type: 'image', url: img.url })
          imageNodeIds.add(img.id)
        })

        networkNodes?.forEach(cap => {
          // Add caption node
          nodes.push({ id: cap.id, type: 'caption', content: cap.content, likes: cap.like_count })
          
          // Connect to image if the image exists in our image set
          if (cap.image_id && imageNodeIds.has(cap.image_id)) {
            links.push({ source: cap.id, target: cap.image_id })
          }
        })

        setNetworkData({ nodes, links })

      } catch (err: any) {
        console.error("Fetch error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Dashboard...</div>
  if (error) return <div className="p-8 text-red-500 text-center glass-panel">Error: {error}</div>

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* --- QUICK STATS --- */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 backdrop-blur-sm">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Total Users</div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{counts.users.toLocaleString()}</div>
          </div>
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 backdrop-blur-sm">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Total Images</div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{counts.images.toLocaleString()}</div>
          </div>
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 backdrop-blur-sm">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Total Captions</div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{counts.captions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 h-full">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" /> Recent Images
          </h3>
          <ul className="space-y-3">
            {recentData.images.map((img) => (
              <li key={img.id} className="text-sm text-slate-600 border-b border-slate-100 pb-2 last:border-0 flex items-center gap-3">
                <div className="w-10 h-8 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="truncate flex-1 font-mono text-xs">{img.url}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-6 h-full">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-500" /> Recent Captions
          </h3>
          <ul className="space-y-3">
            {recentData.captions.map((cap) => (
              <li key={cap.id} className="text-sm text-slate-600 border-b border-slate-100 pb-2 last:border-0">
                <p className="line-clamp-2 italic">&quot;{cap.content}&quot;</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- KEY METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-5 h-5 text-blue-600" />} 
          label="Total Users" 
          value={counts.users.toLocaleString()} 
          color="blue"
        />
        <StatCard 
          icon={<ImageIcon className="w-5 h-5 text-purple-600" />} 
          label="Total Memes" 
          value={counts.images.toLocaleString()} 
          color="purple"
        />
        <StatCard 
          icon={<Type className="w-5 h-5 text-amber-600" />} 
          label="Total Captions" 
          value={counts.captions.toLocaleString()} 
          color="amber"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-green-600" />} 
          label="Active Users" 
          value={counts.activeToday.toLocaleString()} 
          color="green"
        />
      </div>

      {/* --- ANALYTICS --- */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight pl-2">Analytics</h2>
        
        <div className="grid grid-cols-1 gap-8">
          <ChartCard title="Meme Birth Rate" subtitle="Images created per day (Last 30 days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.memeBirthRate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* --- PERFORMANCE ANALYTICS --- */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight pl-2 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-indigo-500" /> Performance Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Flavor Performance" subtitle="Average likes per humor flavor (Top 10)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.flavorPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="slug" 
                  type="category" 
                  fontSize={10} 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="avgLikes" radius={[0, 4, 4, 0]}>
                  {analyticsData.flavorPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={d3.interpolateSpectral(index / 10)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Model Performance" subtitle="Average likes by LLM model">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.modelPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" fontSize={10} stroke="#64748b" axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="avgLikes" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard title="Rating Distribution" subtitle="Frequency of like counts across all captions">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="rating" fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} label={{ value: 'Likes', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>

      {/* --- CONTENT INSIGHTS --- */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight pl-2">Content Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-full">
            <ChartCard title="Viral Meme Network" subtitle="Meme-Caption relationships (Click nodes to inspect)">
              <NetworkGraph data={networkData} />
            </ChartCard>
          </div>

          <div className="lg:col-span-1 h-full">
            <ChartCard title="Leaderboard" subtitle="Top performing captions">
              <Leaderboard supabase={supabase} />
            </ChartCard>
          </div>
        </div>
      </div>

    </div>
  )
}

// --- Sub-components ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: any = {
    blue: "bg-blue-50/50 text-blue-600 border-blue-100 hover:border-blue-200 hover:bg-blue-50",
    purple: "bg-purple-50/50 text-purple-600 border-purple-100 hover:border-purple-200 hover:bg-purple-50",
    amber: "bg-amber-50/50 text-amber-600 border-amber-100 hover:border-amber-200 hover:bg-amber-50",
    green: "bg-green-50/50 text-green-600 border-green-100 hover:border-green-200 hover:bg-green-50",
  }

  return (
    <div className={cn(
      "p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      colorMap[color] || "bg-white/50 border-gray-100"
    )}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-white/50">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-800 leading-none mt-1 font-sans">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[300px]">
        {children}
      </div>
    </div>
  )
}

function NetworkGraph({ data }: { data: { nodes: any[], links: any[] } }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return

    const width = containerRef.current.clientWidth
    const height = 500
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(40).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("collide", d3.forceCollide().radius(20))
      .force("center", d3.forceCenter(width / 2, height / 2))

    const g = svg.append("g")

    const link = g.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1.5)

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setHoveredNode(d)
        setTooltipPos({ x: event.pageX, y: event.pageY })
      })
      .on("mousemove", (event) => {
        setTooltipPos({ x: event.pageX, y: event.pageY })
      })
      .on("mouseleave", () => {
        setHoveredNode(null)
      })
      .on("click", (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
      })
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    node.append("circle")
      .attr("r", d => d.type === 'image' ? 14 : Math.max(6, Math.min(18, (d.likes || 0) / 2)))
      .attr("fill", d => d.type === 'image' ? "#3b82f6" : "#fbbf24")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "transition-all duration-200 hover:stroke-gray-400")

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    svg.call(d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      g.attr("transform", event.transform)
    }))

  }, [data])

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-xl bg-slate-50/50 overflow-hidden min-h-[500px] border border-slate-100">
      <svg ref={svgRef} className="w-full h-[500px] cursor-move" />
      
      {/* Interaction Tooltip */}
      {hoveredNode && (
        <div 
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 transition-opacity duration-200"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 max-w-[250px]">
            {hoveredNode.type === 'image' ? (
              <div className="space-y-2">
                <img src={hoveredNode.url} alt="Meme Preview" className="w-full h-auto rounded-lg object-contain max-h-[200px]" />
                <p className="text-[10px] text-slate-400 uppercase font-bold text-center tracking-wider">Meme Node</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-800 leading-snug font-medium">"{hoveredNode.content}"</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Caption</span>
                  <span className="text-[10px] text-slate-500 font-mono">{hoveredNode.likes} likes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute inset-0 flex items-center justify-center z-40 p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
          <div className="glass-panel p-6 max-w-md w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                {selectedNode.type === 'image' ? 'Meme Details' : 'Caption Details'}
              </h4>
              <button 
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                &times;
              </button>
            </div>
            
            {selectedNode.type === 'image' ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                  <img src={selectedNode.url} alt="Full size" className="w-full h-auto" />
                </div>
                <div className="text-xs font-mono text-slate-400 truncate">{selectedNode.id}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <blockquote className="text-xl font-medium text-slate-800 italic border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 rounded-r-lg">
                  "{selectedNode.content}"
                </blockquote>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg text-center">
                    <div className="text-xs text-slate-500 uppercase">Likes</div>
                    <div className="text-xl font-bold text-blue-600">{selectedNode.likes}</div>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg text-center">
                    <div className="text-xs text-slate-500 uppercase">ID</div>
                    <div className="text-xs font-mono text-slate-800 mt-1 truncate px-2">{selectedNode.id.substring(0,8)}...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex gap-3 text-[10px] font-bold text-slate-500 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" /> MEME</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" /> CAPTION</div>
      </div>
    </div>
  )
}

function Leaderboard({ supabase }: { supabase: any }) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    async function fetchTop() {
      const { data: top } = await supabase
        .from("captions")
        .select("id, content, like_count, images(url)")
        .order("like_count", { ascending: false })
        .limit(10)
      setData(top || [])
    }
    fetchTop()
  }, [supabase])

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {data.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all border border-transparent hover:border-white/50 group">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-inner">
            {idx + 1}
          </div>
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/50 shadow-sm">
            {item.images?.url ? (
              <img src={item.images.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50"><ImageIcon className="w-5 h-5 text-slate-300" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 font-medium truncate leading-tight mb-1">{item.content}</p>
            <p className="text-[10px] text-blue-500 flex items-center gap-1 font-bold uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-full">
              <TrendingUp className="w-2.5 h-2.5" /> {item.like_count}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
