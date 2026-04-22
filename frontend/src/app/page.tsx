"use client";

import { motion } from "framer-motion";
import StatsGrid from "@/components/Dashboard/StatsGrid";
import BookingModal from "@/components/Dashboard/BookingModal";
import { Search, Bell, Plus, MessageSquare, Bot, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    async function fetchRecentactivity() {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) setConversations(data);
    }

    fetchRecentactivity();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
        setConversations(prev => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-12">
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onSuccess={() => {
          // You could add a success toast here
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">Overview</h2>
          <p className="text-purple-400 mt-2 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            Supabase Live Node: Integrated
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            Booking
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="space-y-12">
        <StatsGrid />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Activity Area */}
          <div className="xl:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[2.5rem] border border-white/5"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold">AI Interaction Hub</h3>
                  <p className="text-sm text-zinc-500">Live monitoring via Supabase Real-time</p>
                </div>
                <button className="text-sm font-bold text-purple-400 hover:text-purple-300">Open Logs</button>
              </div>
              
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="p-4 bg-white/5 rounded-3xl">
                      <Bot className="w-8 h-8 text-purple-500" />
                    </div>
                    <p className="text-zinc-500 max-w-xs text-sm italic">Waiting for messages... Conversation tokens will sync here live from Supabase.</p>
                  </div>
                ) : (
                  conversations.map((msg, i) => (
                    <div key={msg.id} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold text-sm">Customer Entry</p>
                          <span className="text-[10px] text-zinc-500">Just now</span>
                        </div>
                        <p className="text-sm text-zinc-400">"{msg.incoming_text}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-[2.5rem] border border-white/5"
          >
            <div className="flex items-center gap-3 mb-8">
              <Database className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-bold">Core Health</h3>
            </div>
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Edge Status</p>
                <p className="text-sm font-medium">Supabase Connection: ACTIVE</p>
              </div>
              <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Real-time Sync</p>
                <p className="text-sm font-medium">Postgres Listeners: LIVE</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

