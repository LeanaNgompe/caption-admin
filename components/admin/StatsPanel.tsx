"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import * as d3 from "d3"
import { 
  Users, 
  Image as ImageIcon, 
  Type, 
  Activity, 
  TrendingUp, 
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
    memeBirthRate: any[]
  }>({ memeBirthRate: [] })
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

        setAnalyticsData({
          memeBirthRate: birthRateGrouped
        })

        // 5. Network Visualization Data
        const { data: networkNodes } = await supabase.from("captions").select("id, content, like_count, image_id").limit(100)
        const { data: allImages } = await supabase.from("images").select("id, url").limit(30)

        const nodes: any[] = []
        const links: any[] = []
        const imageNodeIds = new Set()

        allImages?.forEach(img => {
          nodes.push({ id: img.id, type: 'image', url: img.url })
          imageNodeIds.add(img.id)
        })

        networkNodes?.forEach(cap => {
          // Add caption node
          nodes.push({ id: cap.id, type: 'caption', content: cap.content, likes: cap.like_count })
          
          // Connect to image if the image exists in our image set
          if (imageNodeIds.has(cap.image_id)) {
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

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Analytics Dashboard...</div>
  if (error) return <div className="p-8 text-red-500 text-center">Error: {error}</div>

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* --- QUICK STATS --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-bold text-gray-900">{counts.users}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Images</div>
            <div className="text-2xl font-bold text-gray-900">{counts.images}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Captions</div>
            <div className="text-2xl font-bold text-gray-900">{counts.captions}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Recent Images</h3>
          <ul className="space-y-2">
            {recentData.images.map((img) => (
              <li key={img.id} className="text-sm truncate text-gray-600 border-b border-gray-50 pb-2">{img.url}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Recent Captions</h3>
          <ul className="space-y-2">
            {recentData.captions.map((cap) => (
              <li key={cap.id} className="text-sm truncate text-gray-600 border-b border-gray-50 pb-2">{cap.content}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- KEY METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-5 h-5 text-blue-500" />} 
          label="Total Users" 
          value={counts.users.toLocaleString()} 
          color="blue"
        />
        <StatCard 
          icon={<ImageIcon className="w-5 h-5 text-purple-500" />} 
          label="Total Memes" 
          value={counts.images.toLocaleString()} 
          color="purple"
        />
        <StatCard 
          icon={<Type className="w-5 h-5 text-amber-500" />} 
          label="Total Captions" 
          value={counts.captions.toLocaleString()} 
          color="amber"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-green-500" />} 
          label="Active Users Today" 
          value={counts.activeToday.toLocaleString()} 
          color="green"
        />
      </div>

      {/* --- ANALYTICS --- */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h2>
        
        <div className="grid grid-cols-1 gap-8">
          <ChartCard title="Meme Birth Rate" subtitle="Images created per day (Last 30 days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.memeBirthRate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  stroke="#888"
                />
                <YAxis fontSize={10} stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* --- CONTENT INSIGHTS --- */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Content Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChartCard title="Viral Meme Network Graph" subtitle="Meme-Caption relationships (Hover nodes to preview)">
              <NetworkGraph data={networkData} />
            </ChartCard>
          </div>

          <div className="lg:col-span-1">
            <ChartCard title="Top Captions Leaderboard" subtitle="Most liked captions overall">
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
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
    purple: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
    amber: "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300",
    green: "bg-green-50 text-green-600 border-green-100 hover:border-green-300",
  }

  return (
    <div className={cn(
      "p-5 rounded-xl border shadow-sm transition-all duration-300 group",
      colorMap[color] || "bg-white border-gray-100"
    )}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-inherit group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-gray-900 leading-none mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return

    const width = containerRef.current.clientWidth
    const height = 500

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const simulation = d3
      .forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide().radius(30))
      .force("center", d3.forceCenter(width / 2, height / 2))

    const g = svg.append("g")

    const link = g
      .append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1.5)

    const node = g
      .append("g")
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
      .call(
        d3
          .drag<any, any>()
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
          })
      )

    node
      .append("circle")
      .attr("r", (d: any) =>
        d.type === "image" ? 14 : Math.max(6, Math.min(18, (d.likes || 0) / 2))
      )
      .attr("fill", (d: any) => (d.type === "image" ? "#3b82f6" : "#fbbf24"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    svg.call(
      d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
        g.attr("transform", event.transform)
      })
    )
  }, [data])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative border rounded-lg bg-slate-50 overflow-hidden min-h-[500px]"
    >
      <svg ref={svgRef} className="w-full h-[500px] cursor-move" />

      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-white p-2 rounded-lg shadow-xl border border-gray-200 max-w-[250px]">
            {hoveredNode.type === "image" ? (
              <div className="space-y-2">
                <img
                  src={hoveredNode.url}
                  className="w-full rounded-md object-contain max-h-[200px]"
                />
                <p className="text-[10px] text-gray-400 uppercase font-bold text-center">
                  Meme Node
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm italic text-gray-800">
                  "{hoveredNode.content}"
                </p>
                <div className="flex justify-between text-[10px] mt-2 pt-2 border-t">
                  <span className="font-bold text-blue-500">Caption</span>
                  <span className="text-gray-500">
                    {hoveredNode.likes} likes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] font-bold text-gray-500 bg-white/90 px-3 py-2 rounded-full border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          MEME
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          CAPTION
        </div>
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
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 group">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            {idx + 1}
          </div>
          <div className="w-14 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50 shadow-sm">
            {item.images?.url ? (
              <img src={item.images.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-semibold truncate leading-tight mb-1">{item.content}</p>
            <p className="text-[10px] text-blue-500 flex items-center gap-1 font-black uppercase tracking-widest">
              <TrendingUp className="w-2.5 h-2.5" /> {item.like_count} likes
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
