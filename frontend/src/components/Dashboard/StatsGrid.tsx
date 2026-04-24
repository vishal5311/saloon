import { motion } from "framer-motion";
import { Users, CheckCircle2, TrendingUp, MessageSquare, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

export default function StatsGrid() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Customers", value: "0", change: "Live", trendingUp: true, icon: Users, key: 'customers' },
    { label: "Today Bookings", value: "0", change: "Live", trendingUp: true, icon: CheckCircle2, key: 'today_bookings' },
    { label: "Total Bookings", value: "0", change: "Live", trendingUp: true, icon: Database, key: 'total_bookings' },
    { label: "Pending Appts", value: "0", change: "Live", trendingUp: true, icon: TrendingUp, key: 'pending' },
    { label: "AI Calls Today", value: "0", change: "Live", trendingUp: true, icon: MessageSquare, key: 'ai_calls' },
  ]);

  async function fetchStats() {
    try {
      const data = await dataService.getDashboardStats();
      
      setStats(prev => prev.map(s => {
        if (s.key === 'customers') return { ...s, value: `${data.totalCustomers}` };
        if (s.key === 'today_bookings') return { ...s, value: `${data.todayBookings}` };
        if (s.key === 'total_bookings') return { ...s, value: `${data.totalBookings}` };
        if (s.key === 'pending') return { ...s, value: `${data.pendingAppointments}` };
        if (s.key === 'ai_calls') return { ...s, value: `${data.aiCallsToday}` };
        return s;
      }));
    } catch (e) {
      console.error("Dashboard Stats Fetch Failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();

    // REALTIME: Subscribe to changes and refresh stats
    const channels = [
      supabase.channel('stats-apps').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchStats).subscribe(),
      supabase.channel('stats-cust').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchStats).subscribe(),
      supabase.channel('stats-conv').on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchStats).subscribe()
    ];

    return () => {
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <stat.icon className="w-12 h-12 text-purple-400" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <stat.icon className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trendingUp ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {stat.change}
            </div>
          </div>
          
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold tracking-tight">
              {loading ? <span className="animate-pulse opacity-50">...</span> : stat.value}
            </h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
