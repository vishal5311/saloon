"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Phone, 
  Settings, 
  LogOut,
  Scissors,
  Activity
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Calendar, label: "Appointments", href: "/appointments" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Phone, label: "AI Call Logs", href: "/calls" },
  { icon: Activity, label: "Diagnostics", href: "/diagnostics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 border-r border-white/5 h-screen p-8 flex flex-col bg-[#050505] fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-16">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">SalonAI</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Premium CRM</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group
                  ${isActive 
                    ? "bg-white/5 border border-white/10 shadow-xl text-white" 
                    : "text-white/40 hover:text-white"
                  }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full"
                  />
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-500" : "group-hover:text-blue-400"}`} />
                <span className="font-medium text-[15px] tracking-tight">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-white/5">
        <button className="flex items-center gap-3 px-5 py-3.5 text-white/40 hover:text-red-400 transition-colors w-full group rounded-2xl">
          <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          <span className="font-medium text-[15px] tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
