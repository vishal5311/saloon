"use client";

import { motion } from "framer-motion";
import { MessageSquare, Phone, Clock, Search, Send, User, Bot, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AIInteractionPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [manualMsg, setManualMsg] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        customers(full_name, mobile_number)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('conversations-chat-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMsg.trim() || !selected) return;

    setIsSending(true);
    const { error } = await supabase
      .from('conversations')
      .insert([{
        customer_id: selected.customer_id,
        incoming_text: manualMsg,
        channel: 'Manual',
        source_type: 'manual',
        intent: 'human_reply'
      }]);

    if (!error) {
      setManualMsg("");
      fetchConversations();
    } else {
      alert("Error sending message: " + error.message);
    }
    setIsSending(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Chat Logs</h2>
        <p className="text-zinc-400 mt-1">Live monitoring of your AI assistant's interactions.</p>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Chat List */}
        <div className="w-1/3 glass rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No conversations logged yet.</div>
            ) : (
              conversations.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelected(chat)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${selected?.id === chat.id ? 'bg-purple-600/10 border-l-4 border-l-purple-600' : 'hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm">{chat.customers?.full_name || 'Guest'}</h4>
                    <span className="text-[10px] text-zinc-500">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mb-2">"{chat.incoming_text}"</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase">{chat.source_type || 'Voice'}</span>
                    {chat.sentiment && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                        chat.sentiment.toLowerCase().includes('pos') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {chat.sentiment}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Detail */}
        {selected ? (
          <div className="flex-1 glass rounded-3xl flex flex-col relative overflow-hidden">
            {/* AI Status Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{selected.customers?.full_name || 'Guest'}</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    AI Processed ({selected.channel})
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 glass rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">TAKE OVER</button>
              </div>
            </div>

            {/* Messages Wrapper */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                  {new Date(selected.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              {/* Customer Message */}
              <div className="flex gap-4 items-end">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none max-w-[70%]">
                  <p className="text-sm">{selected.incoming_text}</p>
                </div>
              </div>

              {/* AI Response (Mocked from summary if available) */}
              <div className="flex gap-4 items-end justify-end">
                <div className="bg-purple-600/20 border border-purple-500/20 p-4 rounded-2xl rounded-br-none max-w-[70%]">
                  <p className="text-sm italic text-zinc-300">
                    {selected.transcript_summary || "AI analyzed this interaction and identified intent: " + (selected.intent || "Unknown")}
                  </p>
                  <div className="mt-2 pt-2 border-t border-purple-500/10 flex items-center gap-2">
                    <Bot className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest leading-none">
                      AI Log: {selected.intent ? `Intent: ${selected.intent}` : "Handled"}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Input Area (For Manual Override) */}
            <form onSubmit={handleManualSend} className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-xl">
              <div className="relative">
                <input 
                  type="text" 
                  value={manualMsg}
                  onChange={(e) => setManualMsg(e.target.value)}
                  placeholder="Type a manual reply to take over..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <button 
                  type="submit"
                  disabled={isSending || !manualMsg.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 glass rounded-3xl flex items-center justify-center text-zinc-500">
            Select a conversation to view details
          </div>
        )}
      </div>
    </div>
  );
}

