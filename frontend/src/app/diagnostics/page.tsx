"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Phone, Bot, Sparkles, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function runDiagnostics() {
    setLoading(true);
    try {
      const r = await fetch('/api/diagnostics');
      const data = await r.json();
      setDiagnostics(data);
    } catch (e) {
      setDiagnostics({ error: "Failed to connect to Diagnostics API" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20"><CheckCircle className="w-4 h-4 text-green-500" /></div>;
    if (status === 'error') return <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><XCircle className="w-4 h-4 text-red-500" /></div>;
    return <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20"><AlertCircle className="w-4 h-4 text-yellow-500" /></div>;
  };

  return (
    <div className="relative space-y-10 max-w-4xl mx-auto pb-20">
      {/* Background Grid */}
      <div className="absolute inset-0 figma-grid-bg opacity-10 fixed pointer-events-none" />

      <header className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Integrity Check</span>
        </div>
        <h2 className="text-4xl font-semibold tracking-tight text-white">Infrastructure <span className="text-gradient-blue">Pulse</span></h2>
        <p className="text-white/40 mt-2 font-light">Real-time health monitoring of database, automation nodes, and AI engines.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Supabase Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tech-card p-8 rounded-[2.5rem] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              {diagnostics && <StatusIcon status={diagnostics.supabase.status} />}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Supabase Connectivity</h3>
            <p className="text-sm text-white/40 font-light leading-relaxed">
              {diagnostics?.supabase.details || "Initialising handshake..."}
            </p>
          </div>
          <div className="flex gap-3 mt-8">
            <span className={`text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest ${diagnostics?.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>Endpoint</span>
            <span className={`text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest ${diagnostics?.env.SUPABASE_SERVICE_ROLE_KEY ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' : 'bg-red-500/10 text-red-500 border border-red-500/10'}`}>Key Node</span>
          </div>
        </motion.div>

        {/* Twilio Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="tech-card p-8 rounded-[2.5rem] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              {diagnostics && <StatusIcon status={diagnostics.twilio.status} />}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Automation Node</h3>
            <p className="text-sm text-white/40 font-light leading-relaxed">
              {diagnostics?.twilio.details || "Pinging WhatsApp gateway..."}
            </p>
          </div>
          <div className="flex gap-3 mt-8">
            <span className={`text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest ${diagnostics?.env.TWILIO_ACCOUNT_SID ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' : 'bg-red-500/10 text-red-500 border border-red-500/10'}`}>SID</span>
            <span className={`text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest ${diagnostics?.env.TWILIO_AUTH_TOKEN ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' : 'bg-red-500/10 text-red-500 border border-red-500/10'}`}>Auth</span>
          </div>
        </motion.div>

        {/* AI Agent Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="tech-card p-8 rounded-[2.5rem] md:col-span-2 relative overflow-hidden"
        >
          <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <StatusIcon status={diagnostics?.env.RETELL_AGENT_ID ? 'ok' : 'warn'} />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Intelligence Matrix</h3>
                <p className={`text-sm font-light ${diagnostics?.env.RETELL_AGENT_ID ? 'text-white/40' : 'text-yellow-500/80'}`}>
                  {diagnostics?.env.RETELL_AGENT_ID 
                    ? "Neural nodes configured correctly. Voice interactions active." 
                    : "Warning: Missing Agent ID! AI receptionist is currently disconnected from the voice node."}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Retell Node ID</span>
                </div>
                <code className="text-xs font-mono text-white/60">{diagnostics?.env.RETELL_AGENT_ID || "UNDETECTED"}</code>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="flex justify-center mt-12 relative z-10">
        <button 
          onClick={runDiagnostics}
          disabled={loading}
          className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-white/5"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          Run System Integrity Scan
        </button>
      </div>

      {diagnostics?.error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-red-500 text-sm font-bold flex items-center gap-4 relative z-10"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {diagnostics.error}
        </motion.div>
      )}
    </div>
  );
}
