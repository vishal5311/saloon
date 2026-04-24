"use client";

import { motion } from "framer-motion";
import { Phone, Calendar, Clock, MessageSquare, Search } from "lucide-react";
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Call Logs</h2>
          <p className="text-zinc-400 mt-1">Review all voice AI interactions and customer intents.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 animate-pulse">Syncing Call Logs...</div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            {searchQuery ? "No call logs match your search." : "No AI calls recorded yet today."}
          </div>
        ) : (
          filteredCalls.map((call, i) => (
            <motion.div 
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{call.customers?.full_name || "Unknown Caller"}</h4>
                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> {call.customers?.mobile_number || "Private Number"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      {new Date(call.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-500/20">
                    {call.sentiment || "Positive"}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-purple-400 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">AI Summary</p>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {call.summary || "Customer called to inquire about service pricing and stylist availability."}
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
