"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Clock, Activity, Phone } from "lucide-react";

export default function StatsGrid({ stats }: { stats: any }) {
  const items = [
    { 
      label: "Total Customers", 
      value: stats?.totalCustomers || 0, 
      icon: Users, 
      color: "blue",
      desc: "Infrastructure reach"
    },
    { 
      label: "Today's Bookings", 
      value: stats?.todayBookings || 0, 
      icon: Calendar, 
      color: "blue",
      desc: "Daily transaction flow"
    },
    { 
      label: "Scheduled", 
      value: stats?.pendingAppointments || 0, 
      icon: Activity, 
      color: "blue",
      desc: "Upcoming settlement"
    },
    { 
      label: "Total Flow", 
      value: stats?.totalBookings || 0, 
      icon: Clock, 
      color: "blue",
      desc: "Historical processing"
    },
    { 
      label: "AI Node Active", 
      value: stats?.aiCallsToday || 0, 
      icon: Phone, 
      color: "blue",
      desc: "Voice interactions"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="tech-card p-6 rounded-[28px] relative overflow-hidden group"
        >
          <div className="flex justify-between items-start relative z-10 mb-4">
            <div className={`p-3 rounded-xl bg-blue-50 text-blue-600 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
          
          <div className="relative z-10 space-y-1">
            <h4 className="text-3xl font-semibold text-[#0C0B07] tracking-tighter">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </h4>
            <p className="text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest">{item.label}</p>
            <p className="text-[10px] text-[#5E5E5E] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {item.desc}
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
        </motion.div>
      ))}
    </div>
  );
}
