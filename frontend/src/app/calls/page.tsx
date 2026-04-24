"use client";

import { motion } from "framer-motion";
import { Phone, Calendar, Clock, MessageSquare, Search, Activity, Bot, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

export default function AICallLogsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchConversations() {
    setLoading(true);
    try {
      const data = await dataService.getCalls();
      setConversations(data);
    } catch (e) {
      console.error("Fetch calls failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('calls-realtime-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCalls = conversations.filter(call => 
    call.customers?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.customers?.mobile_number?.includes(searchQuery)
  );

  return (
    <div className="relative space-y-10 max-w-[1400px] mx-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 figma-grid-bg opacity-10 fixed pointer-events-none" />

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-4">
            <Bot className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Voice Engine Logs</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-white">Interaction <span className="text-gradient-blue">Intelligence</span></h2>
          <p className="text-white/40 mt-2 font-light">Deep analysis of AI-driven voice consultations and customer intent.</p>
        </div>
      </div>

      {/* Filter Area */}
      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search interactions by caller identity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all backdrop-blur-sm text-white"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Corridors: {filteredCalls.length}</span>
        </div>
      </div>

      {/* Logs Area */}
      <div className="space-y-6 relative z-10">
        {loading ? (
          <div className="py-32 text-center text-white/30 animate-pulse font-light">Decrypting Voice Node...</div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-32 text-center text-white/40">
            <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Phone className="w-8 h-8 text-white/10" />
            </div>
            <p className="font-light">{searchQuery ? "No intelligence match your query." : "No voice interactions recorded yet."}</p>
          </div>
        ) : (
          filteredCalls.map((call, i) => (
            <motion.div 
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="tech-card p-8 rounded-[2.5rem] group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{call.customers?.full_name || "Anonymous Operator"}</h4>
                    <p className="text-sm text-white/40 font-mono mt-0.5">
                      {call.customers?.mobile_number || "Uplink Secure"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2 text-white/40 text-xs font-bold">
                    <Calendar className="w-4 h-4" />
                    {new Date(call.created_at).toLocaleDateString()}
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2 text-white/40 text-xs font-bold font-mono">
                    <Clock className="w-4 h-4" />
                    {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-500/20">
                    {call.sentiment || "NEUTRAL"}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1.5">Intelligence Summary</p>
                    <p className="text-white/60 text-sm leading-relaxed font-light">
                      {call.transcript_summary || "Automated interaction processed. System awaiting full transcript analysis from AI Node."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
