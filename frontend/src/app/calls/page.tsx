"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, Calendar, Clock, MessageSquare, Search, Activity, 
  Bot, Sparkles, Play, Download, ChevronRight, User, 
  Zap, BarChart3, Clock3, ShieldCheck, History, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

export default function InteractionIntelligencePage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCalls() {
    try {
      setError(null);
      const data = await dataService.getCalls();
      setCalls(data);
    } catch (e: any) {
      console.error("Fetch calls failed:", e);
      setError(e.message || "Failed to establish connection with database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCalls();

    const channel = supabase
      .channel('calls-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        fetchCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCalls = calls.filter(call => 
    call.customers?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.customers?.mobile_number?.includes(searchQuery) ||
    call.retell_call_id?.includes(searchQuery)
  );

  const activeCalls = filteredCalls.filter(c => ['ringing', 'connected', 'ongoing'].includes(c.status));
  const completedCalls = filteredCalls.filter(c => !['ringing', 'connected', 'ongoing'].includes(c.status));

  const triggerCall = async (phone: string, name: string, id: string) => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, customer_name: name, customer_id: id })
      });
      if (!res.ok) throw new Error('Failed to trigger call');
      alert("Call sequence initiated successfully.");
    } catch (err) {
      console.error(err);
      alert("Error initiating call sequence.");
    } finally {
      setIsTriggering(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'Conversation' | 'Intelligence' | 'Timeline' | 'Raw Data'>('Conversation');
  const [showCallModal, setShowCallModal] = useState(false);
  const [manualPhone, setManualPhone] = useState("");

  const syncRetellData = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/retell/sync', { method: 'POST' });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Server returned an unexpected response format (${res.status}). Check console for details.`);
      }

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Synchronization Complete: ${data.synced} interactions mirrored.`);
        fetchCalls();
      } else {
        throw new Error(data.error || "Unknown synchronization error");
      }
    } catch (err: any) {
      console.error("Sync Error:", err);
      alert(`Sync Failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  const togglePlayback = (url: string) => {
    if (audioInstance) {
      if (isPlaying) {
        audioInstance.pause();
        setIsPlaying(false);
      } else {
        audioInstance.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioInstance(audio);
      setIsPlaying(true);
    }
  };

  // Cleanup audio on unmount or selection change
  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.src = "";
      }
    };
  }, [audioInstance, selectedCall]);

  useEffect(() => {
    setIsPlaying(false);
    setAudioInstance(null);
  }, [selectedCall]);

  return (
    <div className="relative min-h-screen space-y-10 max-w-[1600px] mx-auto p-4 md:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 figma-grid-bg opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-4"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400/80">Aura OS: Data Extraction Mode</span>
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tighter text-white">
            Interaction <span className="text-gradient-blue">Mirroring</span>
          </h1>
          <p className="text-white/40 mt-3 max-w-xl font-light text-lg">
            Synchronize historical and real-time voice data from Retell into your operational intelligence hub.
          </p>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={syncRetellData}
             disabled={isTriggering}
             className="px-6 py-3 bg-blue-600 border border-blue-500/50 rounded-2xl text-white hover:bg-blue-500 transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
           >
             <Bot className="w-4 h-4" />
             {isTriggering ? "Mirroring Data..." : "Sync Retell History"}
           </button>
           <button 
             onClick={() => fetchCalls()}
             className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
           >
             <History className="w-4 h-4" />
             Refresh
           </button>
        </div>
      </header>

      {error && (
        <div className="relative z-10 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
          <Activity className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        {[
          { label: "Active Nodes", value: activeCalls.length, icon: Activity, color: "text-green-400" },
          { label: "Total Synced", value: completedCalls.length, icon: BarChart3, color: "text-blue-400" },
          { label: "Total Duration", value: formatDuration(calls.reduce((acc, c) => acc + (c.duration || 0), 0)), icon: Clock3, color: "text-purple-400" },
          { label: "Operational Fidelity", value: "100%", icon: ShieldCheck, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div key={i} className="tech-card p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Call List */}
        <div className="xl:col-span-5 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID, Customer, or Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all backdrop-blur-md text-white placeholder:text-white/20"
            />
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-white/20 font-mono tracking-tighter">Decrypting call stream...</div>
            ) : filteredCalls.length === 0 ? (
              <div className="py-20 text-center text-white/20">No matching interactions found.</div>
            ) : (
              filteredCalls.map((call) => (
                <motion.div 
                  layoutId={call.id}
                  key={call.id}
                  onClick={() => {
                    setSelectedCall(call);
                    setActiveTab('Conversation');
                  }}
                  className={`tech-card p-5 rounded-3xl border cursor-pointer transition-all ${
                    selectedCall?.id === call.id ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        activeCalls.includes(call) ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-white/5 text-white/40'
                      }`}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{call.customers?.full_name || "Unknown Identity"}</h4>
                        <p className="text-xs text-white/30 font-mono mt-0.5">{call.customers?.mobile_number || "Secured Line"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                         call.status === 'completed' || call.status === 'analyzed' ? 'bg-green-500/10 text-green-500' : 
                         ['ringing', 'connected', 'ongoing'].includes(call.status) ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-white/40'
                       }`}>
                         {call.status}
                       </span>
                       <p className="text-[10px] text-white/20 font-mono mt-2">
                         {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                  
                  {['ringing', 'connected', 'ongoing'].includes(call.status) && (
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="h-full w-1/3 bg-blue-500"
                      />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interaction Replay System */}
        <div className="xl:col-span-7">
          <AnimatePresence mode="wait">
            {selectedCall ? (
              <motion.div 
                key={selectedCall.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="tech-card h-full rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col"
              >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedCall.customers?.full_name || "Operational Target"}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/40 font-mono uppercase tracking-widest">{selectedCall.retell_call_id}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs text-blue-400 font-bold">{selectedCall.duration ? formatDuration(selectedCall.duration) : 'Realtime'}</span>
                        {selectedCall.voice_profile && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold uppercase tracking-tighter">
                              {selectedCall.voice_profile}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {selectedCall.recording_url && (
                      <a 
                        href={selectedCall.recording_url} 
                        download 
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all"
                        title="Download Recording"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedCall(null)}
                      className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl text-white/60 hover:text-red-400 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-Header Tabs */}
                <div className="px-8 py-4 border-b border-white/5 flex gap-6 overflow-x-auto no-scrollbar">
                  {(['Conversation', 'Intelligence', 'Timeline', 'Raw Data'] as const).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`text-[10px] font-bold uppercase tracking-widest py-2 border-b-2 transition-all ${
                        activeTab === tab ? 'text-blue-400 border-blue-400' : 'text-white/20 border-transparent hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                  {activeTab === 'Conversation' && (
                    <div className="space-y-6">
                      {selectedCall.transcript_object && Array.isArray(selectedCall.transcript_object) ? (
                        selectedCall.transcript_object.map((utt: any, idx: number) => (
                          <div key={idx} className={`flex ${utt.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] rounded-3xl p-5 ${
                              utt.role === 'agent' 
                                ? 'bg-blue-600/10 border border-blue-500/20 text-white rounded-tl-none' 
                                : 'bg-white/5 border border-white/10 text-white/80 rounded-tr-none'
                            }`}>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-40">
                                {utt.role === 'agent' ? 'Maya (Aura AI)' : 'Customer'}
                              </p>
                              <p className="text-sm leading-relaxed font-light">
                                {utt.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : selectedCall.transcript ? (
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                           <p className="text-[10px] font-bold uppercase tracking-widest mb-4 text-white/20">Operational Transcript</p>
                           <div className="space-y-4">
                             {selectedCall.transcript.split('\n').map((line: string, i: number) => {
                               const isMaya = line.toLowerCase().includes('agent:') || line.toLowerCase().includes('maya:');
                               return (
                                 <div key={i} className="flex flex-col gap-1">
                                   <p className={`text-sm leading-relaxed ${isMaya ? 'text-blue-400 font-medium' : 'text-white/60 font-light'}`}>
                                     {line}
                                   </p>
                                 </div>
                               );
                             })}
                           </div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-white/20 font-mono text-sm">
                          Waiting for transcript payload...
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Intelligence' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Intelligence Summary</p>
                          <p className="text-sm text-white/60 leading-relaxed font-light">{selectedCall.summary || "Summary pending analysis..."}</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Sentiment Score</p>
                            <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${selectedCall.sentiment === 'positive' ? 'bg-green-400' : 'bg-blue-400'}`} />
                               <span className="text-xl font-bold text-white uppercase">{selectedCall.sentiment || "Neutral"}</span>
                            </div>
                          </div>
                          <div className="mt-4">
                             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Intent Detection</p>
                             <p className="text-xs text-blue-400 font-medium">Service Inquiry / Booking</p>
                          </div>
                        </div>
                      </div>

                      {/* Voice Intelligence Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">Voice Profile</p>
                            <p className="text-xl font-bold text-white capitalize">{selectedCall.voice_profile || "Analyzing..."}</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                            <Bot className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest mb-1">Detection Confidence</p>
                            <p className="text-xl font-bold text-white">{selectedCall.confidence_score ? `${Math.round(selectedCall.confidence_score * 100)}%` : "--%"}</p>
                          </div>
                          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      
                      {selectedCall.booking_actions && (
                         <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                           <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Captured Actions</p>
                           <pre className="text-xs text-blue-400/80 font-mono">{JSON.stringify(selectedCall.booking_actions, null, 2)}</pre>
                         </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Timeline' && (
                    <div className="space-y-8 py-4">
                      {selectedCall.state_events?.map((ev: any, idx: number) => (
                        <div key={idx} className="flex gap-6 relative">
                          {idx !== selectedCall.state_events.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-[-20px] w-[1px] bg-white/5" />
                          )}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            ev.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">{ev.event.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-white/40 mt-1">{new Date(ev.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Raw Data' && (
                    <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 font-mono text-[10px] text-blue-400/60 overflow-x-auto">
                      <pre>{JSON.stringify(selectedCall.raw_data || selectedCall, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Footer Playback */}
                {selectedCall.recording_url && (
                  <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                       <button 
                         onClick={() => togglePlayback(selectedCall.recording_url)}
                         className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-blue-500/40"
                       >
                         {isPlaying ? <X className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                       </button>
                       <div className="flex-1">
                         <div className="flex justify-between mb-2 text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                           <span>{isPlaying ? 'Streaming Native Recording...' : 'Ready to Replay'}</span>
                           <span>{selectedCall.duration ? formatDuration(selectedCall.duration) : '--:--'}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: isPlaying ? "100%" : "0%" }}
                             transition={{ duration: isPlaying ? (selectedCall.duration || 5) : 0, ease: "linear" }}
                             className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                           />
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full tech-card rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-2xl font-bold text-white/40">Select an Intelligence Stream</h3>
                <p className="text-white/20 mt-2 max-w-sm">Pick a call from the left to access full transcripts, recordings, and operational intelligence.</p>
                <div className="mt-8 flex gap-4">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/20 uppercase tracking-widest">Aura OS Ready</div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/20 uppercase tracking-widest">Secure Uplink</div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Call Modal */}
      <AnimatePresence>
        {showCallModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCallModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md tech-card p-8 rounded-[2.5rem] border border-white/10 bg-zinc-900 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Initiate Voice Sequence</h3>
              <p className="text-white/40 text-sm mb-6">Trigger a manual outbound call via Maya Intelligence Node.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 00000 00000"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (manualPhone) {
                      triggerCall(manualPhone, "Manual Trigger", "manual");
                      setShowCallModal(false);
                    }
                  }}
                  disabled={isTriggering}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isTriggering ? "Initiating..." : "Launch Maya Node"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
