"use client";

import { motion } from "framer-motion";
import StatsGrid from "@/components/Dashboard/StatsGrid";
import BookingModal from "@/components/Dashboard/BookingModal";
import { Search, Bell, Plus, MessageSquare, Bot, Database, Sparkles, Activity, Users, Calendar, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { dataService } from "@/lib/data-service";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const dashboardStats = await dataService.getDashboardStats();
      setStats(dashboardStats);
      
      const { data: convs } = await supabase
        .from('conversations')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (convs) setConversations(convs);

      const bookings = await dataService.getAppointmentsByDate(new Date());
      setRecentBookings(bookings.slice(0, 5));
      setLoading(false);
    }
    loadData();

    // Subscribe to new bookings for real-time updates
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          dataService.getAppointmentsByDate(new Date()).then(data => setRecentBookings(data.slice(0, 5)));
          dataService.getDashboardStats().then(setStats);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          setConversations(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background Grid */}
      <div className="figma-grid-bg opacity-30 fixed inset-0 pointer-events-none" />

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onSuccess={() => {
          dataService.getDashboardStats().then(setStats);
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-12 pb-20">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <header className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">System Operational</span>
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              Welcome back, <span className="text-gradient-blue">Manager</span>
            </h1>
            <p className="text-white/40 text-lg font-light max-w-xl leading-relaxed">
              Your salon is currently processing AI-driven consultations and high-frequency bookings in real-time.
            </p>
          </header>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search infrastructure..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all backdrop-blur-sm text-white"
              />
            </div>
            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/20 hover:text-white transition-all backdrop-blur-sm hover:bg-white/10">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <StatsGrid stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Activity Area */}
          <div className="xl:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tech-card p-8 rounded-[2.5rem] relative overflow-hidden"
            >
              <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
              <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">AI Interaction Hub</h3>
                  <p className="text-sm text-white/40">Real-time synchronization via Supabase Node</p>
                </div>
                <Link href="/calls" className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-white/60 hover:bg-white/10 transition-colors">
                  Open Full Logs
                </Link>
              </div>
              
              <div className="space-y-4 relative z-10">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center shadow-inner">
                      <Bot className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-white/30 max-w-xs text-sm font-light leading-relaxed">Waiting for incoming traffic. Conversation tokens will stream here live from the AI Node.</p>
                  </div>
                ) : (
                  conversations.map((msg, i) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all cursor-default"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-white">
                            {msg.customers?.full_name || "Customer Interaction"}
                          </p>
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">LIVE</span>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed line-clamp-2 italic">
                          {msg.transcript_summary || msg.incoming_text || "Call initiated..."}
                        </p>
                        {msg.intent === 'hairstyle_selected' && (
                          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg w-fit">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Style Locked</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="tech-card p-8 rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">Recent Bookings</h3>
                </div>
              </div>
              <div className="space-y-4">
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/20 text-sm font-light">No bookings found for this period.</p>
                  </div>
                ) : (
                  recentBookings.map((app, idx) => (
                    <motion.div 
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Booking ID: #{app.id}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <p className="font-semibold text-[15px] text-white group-hover:text-blue-400 transition-colors">{app.customers?.full_name || "Unknown Customer"}</p>
                      <div className="flex justify-between items-end">
                        <p className="text-xs text-white/40 font-light">{app.services?.name || "Premium Service"}</p>
                        <p className="text-xs font-bold text-white/60">{app.start_time?.split('T')[1]?.substring(0, 5) || "IST"}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <Link href="/appointments" className="block w-full text-center mt-8 text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">
                Open Calendar Infrastructure
              </Link>
            </motion.div>

            {/* System Health Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="tech-card p-8 rounded-[2.5rem] bg-white/5 border border-white/10 text-white"
            >
              <div className="flex items-center gap-3 mb-10">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-semibold tracking-tight text-white">System Health</h3>
              </div>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Automation Node</p>
                    <p className="text-sm font-medium text-white">Twilio & Google API</p>
                  </div>
                  <div className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded tracking-tighter">UP</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">AI Voice Engine</p>
                    <p className="text-sm font-medium text-white">Retell Webhook</p>
                  </div>
                  <div className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded tracking-tighter">LIVE</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
