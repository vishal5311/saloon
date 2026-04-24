"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  Scissors
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Calendar, label: "Appointments", href: "/appointments" },
  { icon: MessageSquare, label: "AI Calls", href: "/calls" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 border-r border-white/5 h-screen p-8 flex flex-col bg-[#050505] fixed left-0 top-0 z-50">
      <div className="flex items-center gap-4 mb-16">
        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20">
          <Scissors className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tighter">SalonAI</h1>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group
                  ${isActive 
                    ? "bg-purple-600/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
                    : "text-zinc-500 hover:text-white"
                  }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-8 bg-purple-600 rounded-full"
                  />
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-purple-500" : "group-hover:text-purple-400"}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-white/5">
        <button className="flex items-center gap-4 px-6 py-4 text-zinc-500 hover:text-red-400 transition-colors w-full group">
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
