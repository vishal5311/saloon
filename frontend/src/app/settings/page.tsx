"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Bell, CreditCard, ChevronRight, Scissors, Store, Loader2, X, CheckCircle2, Save, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const sections = [
  { id: 'profile', icon: Store, title: "Salon Profile", desc: "Manage logo, business hours, and location." },
  { id: 'services', icon: Scissors, title: "Services & Pricing", desc: "Configure your service catalog and categories." },
  { id: 'notifications', icon: Bell, title: "AI Notifications", desc: "Set up WhatsApp and email notification preferences." },
  { id: 'team', icon: Shield, title: "Team & Permissions", desc: "Manage staff roles and dashboard access." },
  { id: 'billing', icon: CreditCard, title: "Billing & Plans", desc: "Current plan: Premium. Manage your subscription." },
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Salon Name</label>
                <input type="text" defaultValue="Salon AI Premium" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Primary Phone</label>
                <input type="text" defaultValue="+91 98765 43210" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Address</label>
              <textarea rows={3} defaultValue="Level 4, Digital Plaza, Mumbai" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={handleSave} className="flex-1 bg-purple-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-zinc-400">Current Catalog</h4>
              <button className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300">
                <Plus className="w-3 h-3" /> Add New
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {services.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 glass rounded-xl border border-white/5">
                  <div>
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-zinc-500">₹{s.price} • {s.duration_minutes}m</p>
                  </div>
                  <button className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveSection(null)} className="w-full bg-white/10 py-3 rounded-xl font-bold mt-4">Done</button>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            {[
              { id: 'whatsapp', title: 'WhatsApp Alerts', desc: 'Send AI-generated responses to WhatsApp' },
              { id: 'email', title: 'Email Summary', desc: 'Receive a daily interaction summary via email' },
              { id: 'appointments', title: 'Booking Confirmations', desc: 'Auto-confirm booked appointments' }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <div 
                  onClick={() => setNotifications(prev => ({ ...prev, [item.id as keyof typeof notifications]: !prev[item.id as keyof typeof notifications] }))}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notifications[item.id as keyof typeof notifications] ? 'bg-purple-600' : 'bg-zinc-800'}`}
                >
                  <motion.div 
                    animate={{ x: notifications[item.id as keyof typeof notifications] ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </div>
              </div>
            ))}
            <button onClick={handleSave} className="w-full bg-purple-600 py-3 rounded-xl font-bold mt-4">Save Preferences</button>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {stylists.map(st => (
                <div key={st.id} className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center font-bold text-purple-400">
                    {st.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{st.full_name}</p>
                    <p className="text-xs text-zinc-500">{st.specialization || 'Master Stylist'}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                </div>
              ))}
            </div>
            <button className="w-full border border-dashed border-white/10 hover:border-purple-600/50 py-3 rounded-xl text-xs font-bold text-zinc-500 transition-colors">+ Add Staff Member</button>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl border border-purple-500/30">
              <h4 className="text-xl font-bold mb-1">Premium Plan</h4>
              <p className="text-sm text-zinc-300">Annual billing cycle • Next payment: May 2026</p>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-2xl font-black">₹4,999<span className="text-sm font-normal text-zinc-500">/mo</span></span>
                <button className="text-xs font-bold text-purple-400 hover:underline">Change Plan</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Usage Limits</h4>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full w-[65%]" />
              </div>
              <p className="text-xs text-zinc-500 text-right">650 / 1000 AI Minutes used</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-400 mt-1">Configure your salon platform and AI preferences.</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveSection(section.id)}
            className="group glass p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all border border-white/5"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <section.icon className="w-6 h-6 text-zinc-400 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{section.title}</h4>
                <p className="text-sm text-zinc-500">{section.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl bg-gradient-to-tr from-purple-900/10 to-blue-900/10 border border-purple-500/20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-lg mb-2">AI Receptionist Config</h4>
            <p className="text-sm text-zinc-400">
              Your AI agent is currently {isAiActive ? 'active and processing 94% of enquiries' : 'paused'}.
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isAiActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {isAiActive ? 'Live' : 'Paused'}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleRetrain}
            disabled={isRetraining}
            className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            {isRetraining && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRetraining ? 'Retraining...' : 'Retrain AI Models'}
          </button>
          <button 
            onClick={() => setIsAiActive(!isAiActive)}
            className={`glass px-6 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors ${!isAiActive ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {isAiActive ? 'Pause AI Receptionist' : 'Resume AI Receptionist'}
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence mode="wait">
        {activeSection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveSection(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">{sections.find(s => s.id === activeSection)?.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1">Update your settings and sync with Supabase</p>
                </div>
                <button onClick={() => setActiveSection(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
              </div>
              
              <div className="min-h-[300px]">
                {renderModalContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[150]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm">AI Models updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


