"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Bell, CreditCard, ChevronRight, Scissors, Store, Loader2, X, CheckCircle2, Save, Plus, Trash2, Activity, Bot, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const sections = [
  { id: 'profile', icon: Store, title: "Salon Infrastructure", desc: "Global identity, operational hours, and node location." },
  { id: 'services', icon: Scissors, title: "Service Protocols", desc: "Configure transaction catalogs and settlement rates." },
  { id: 'notifications', icon: Bell, title: "Automation Alerts", desc: "Orchestrate WhatsApp and system notification streams." },
  { id: 'team', icon: Shield, title: "Fleet Management", desc: "Manage operational permissions and staff access." },
  { id: 'billing', icon: CreditCard, title: "Resource Plans", desc: "Plan: Enterprise. Manage scaling and subscription." },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isAiActive, setIsAiActive] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data States
  const [services, setServices] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  const [notifications, setNotifications] = useState({ whatsapp: true, email: false, appointments: true });

  useEffect(() => {
    async function fetchData() {
      const [servRes, stylRes] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('stylists').select('*')
      ]);
      if (servRes.data) setServices(servRes.data);
      if (stylRes.data) setStylists(stylRes.data);
    }
    fetchData();
  }, []);

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setActiveSection(null);
    }, 1000);
  };

  const renderModalContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Infrastructure Name</label>
                <input type="text" defaultValue="Salon AI Global" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white placeholder:text-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Uplink Contact</label>
                <input type="text" defaultValue="+91 98765 43210" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Geographical Node</label>
              <textarea rows={3} defaultValue="Level 4, Digital Plaza, Mumbai Hub" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={handleSave} className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl shadow-white/5">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Commit Changes
              </button>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Protocol Catalog</h4>
              <button className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">
                <Plus className="w-4 h-4" /> Provision New
              </button>
            </div>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {services.map(s => (
                <div key={s.id} className="flex justify-between items-center p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/20 transition-all group">
                  <div>
                    <p className="font-semibold text-[15px] text-white group-hover:text-blue-400 transition-colors">{s.name}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">₹{s.price} • {s.duration_minutes}m Cycle</p>
                  </div>
                  <button className="p-2 text-white/10 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveSection(null)} className="w-full bg-white/5 text-white/60 py-4 rounded-2xl font-bold mt-4 hover:bg-white/10 transition-colors">Acknowledge</button>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            {[
              { id: 'whatsapp', title: 'WhatsApp Orchestration', desc: 'Auto-stream responses via WhatsApp Node' },
              { id: 'email', title: 'Email Intelligence', desc: 'Receive periodic operation summaries' },
              { id: 'appointments', title: 'Booking Confirmation', desc: 'Auto-provision confirmation tokens' }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-white/40 font-light">{item.desc}</p>
                </div>
                <div 
                  onClick={() => setNotifications(prev => ({ ...prev, [item.id as keyof typeof notifications]: !prev[item.id as keyof typeof notifications] }))}
                  className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${notifications[item.id as keyof typeof notifications] ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: notifications[item.id as keyof typeof notifications] ? 28 : 0 }}
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </div>
              </div>
            ))}
            <button onClick={handleSave} className="w-full bg-white text-black py-4 rounded-2xl font-bold mt-6 hover:bg-white/90 transition-all shadow-xl shadow-white/5">Synchronize Preferences</button>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {stylists.map(st => (
                <div key={st.id} className="flex items-center gap-5 p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/20 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-500">
                    {st.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{st.name}</p>
                    <p className="text-xs text-white/40 font-light">{st.specialization || 'Strategic Operator'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 py-5 rounded-[1.5rem] text-[10px] font-bold text-white/20 uppercase tracking-widest transition-all">+ Add Fleet Member</button>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-8">
            <div className="p-8 bg-white text-black rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 figma-grid-bg opacity-10 scale-50 pointer-events-none invert" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-semibold tracking-tight">Enterprise Node</h4>
                    <p className="text-sm text-black/50 font-light mt-1">Unlimited scaling • Next cycle: May 2026</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest text-white">PRO</div>
                </div>
                <div className="mt-8 pt-8 border-t border-black/10 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Current Rate</p>
                    <span className="text-4xl font-semibold tracking-tighter">₹4,999<span className="text-base font-light text-black/30 ml-2">/mo</span></span>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mb-1">Upgrade Tier</button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Resource Allocation</h4>
                <p className="text-[10px] font-bold text-white/20">650 / 1000 AI Minutes</p>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-1 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="bg-blue-600 h-full rounded-full" 
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative space-y-10 max-w-4xl mx-auto pb-20">
      {/* Background Grid */}
      <div className="absolute inset-0 figma-grid-bg opacity-10 fixed pointer-events-none" />

      <header className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-4">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">System Configuration</span>
        </div>
        <h2 className="text-4xl font-semibold tracking-tight text-white">Infrastructure <span className="text-gradient-blue">Control</span></h2>
        <p className="text-white/40 mt-2 font-light">Global operational parameters and AI node orchestration.</p>
      </header>

      <div className="space-y-4 relative z-10">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveSection(section.id)}
            className="group tech-card p-6 rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all duration-500"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:shadow-lg group-hover:shadow-blue-600/20">
                <section.icon className="w-7 h-7 text-white/20 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{section.title}</h4>
                <p className="text-sm text-white/40 font-light mt-0.5">{section.desc}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/10 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-500">
              <ChevronRight className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Receptionist Control */}
      <div className="tech-card p-10 rounded-[3rem] text-white relative overflow-hidden mt-12 shadow-2xl">
        <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-2xl font-semibold tracking-tight text-white">AI Receptionist Node</h4>
              </div>
              <p className="text-sm text-white/40 font-light max-w-md leading-relaxed">
                Your AI agent is currently {isAiActive ? 'active and optimizing 94% of incoming traffic' : 'paused in maintainance mode'}.
              </p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isAiActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {isAiActive ? 'Operational' : 'Idle'}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
            <button 
              onClick={handleRetrain}
              disabled={isRetraining}
              className="bg-white text-black px-8 py-4 rounded-2xl text-sm font-bold hover:bg-white/90 transition-all flex items-center gap-3 shadow-xl"
            >
              {isRetraining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
              {isRetraining ? 'Synthesizing...' : 'Re-synthesize Intelligence'}
            </button>
            <button 
              onClick={() => setIsAiActive(!isAiActive)}
              className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all border ${!isAiActive ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'}`}
            >
              {isAiActive ? 'Suspend Voice Node' : 'Activate Voice Node'}
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence mode="wait">
        {activeSection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveSection(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl tech-card p-10 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden bg-[#0C0B07]">
              <div className="absolute inset-0 figma-grid-bg opacity-10 scale-50 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold tracking-tight text-white">{sections.find(s => s.id === activeSection)?.title}</h3>
                    <p className="text-sm text-white/40 font-light">Modify infrastructure parameters and sync with Core Node.</p>
                  </div>
                  <button onClick={() => setActiveSection(null)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="min-h-[400px]">
                  {renderModalContent()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 z-[150] border border-white/10">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm">Intelligence Node Updated Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
