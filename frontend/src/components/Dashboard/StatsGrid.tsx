"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  MessageSquare,
  Database
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function StatsGrid() {
  const [stats, setStats] = useState([
    { label: "Today's Revenue", value: "₹0", change: "Live", trendingUp: true, icon: TrendingUp, key: 'revenue' },
    { label: "Total Bookings", value: "0", change: "Live", trendingUp: true, icon: CheckCircle2, key: 'bookings' },
    { label: "AI Handled", value: "0%", change: "Live", trendingUp: true, icon: MessageSquare, key: 'ai' },
    { label: "Total Customers", value: "0", change: "Live", trendingUp: true, icon: Users, key: 'customers' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch Revenue from visits
      const { data: visits } = await supabase
        .from('visits')
        .select('total_amount')
        .gte('visit_date', today);
      
      const totalRevenue = visits?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0;

      // 2. Fetch Customers Count
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // 3. Fetch Appointments Count
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // 4. Calculate AI Handled %
      const { data: convs } = await supabase
        .from('conversations')
        .select('source_type');
      
      const totalConvs = convs?.length || 0;
      const aiConvs = convs?.filter(c => c.source_type !== 'manual').length || 0;
      const aiPercent = totalConvs > 0 ? Math.round((aiConvs / totalConvs) * 100) : 0;

      setStats(prev => prev.map(s => {
        if (s.key === 'revenue') return { ...s, value: `₹${totalRevenue.toLocaleString()}` };
        if (s.key === 'customers') return { ...s, value: `${customerCount || 0}` };
        if (s.key === 'bookings') return { ...s, value: `${appointmentCount || 0}` };
        if (s.key === 'ai') return { ...s, value: `${aiPercent}%` };
        return s;
      }));
    }

    fetchStats();
    
    // Set up real-time subscription for all relevant tables
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="glass p-6 rounded-3xl group hover:border-white/10 transition-colors relative border border-white/5"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-purple-600/20 transition-colors">
              <stat.icon className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 bg-emerald-500/10 text-emerald-400`}>
              {stat.change}
              <Database className="w-3 h-3" />
            </div>
          </div>
          
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

