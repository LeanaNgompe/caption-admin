"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Image as ImageIcon, FileText, Users, LogOut } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/images", label: "Images", icon: ImageIcon },
    { href: "/admin/captions", label: "Captions", icon: FileText },
    { href: "/admin/users", label: "Users", icon: Users },
  ]

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-5xl glass-panel px-6 py-3 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-8">
        <Link href="/admin" className="text-xl font-bold tracking-tight text-slate-800 hover:opacity-80 transition-opacity flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 shadow-md flex items-center justify-center text-white text-xs font-bold">
            CA
          </div>
          CaptionAdmin
        </Link>
        
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 group",
                  isActive 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form action="/auth/signout" method="post">
          <button 
            type="submit" 
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  )
}
