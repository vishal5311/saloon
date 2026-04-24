"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Scissors, Loader2, CheckCircle2, Sparkles, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTime?: string;
}

export default function BookingModal({ isOpen, onClose, onSuccess, initialTime }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    stylist: '',
    date: new Date().toISOString().split('T')[0],
    time: initialTime || '09:00'
  });

  useEffect(() => {
    if (initialTime) setFormData(prev => ({ ...prev, time: initialTime }));
  }, [initialTime]);

  useEffect(() => {
    async function fetchData() {
      const { data: srv } = await supabase.from('services').select('*').eq('active', true);
      const { data: sty } = await supabase.from('stylists').select('*').eq('active', true);
      if (srv) setServices(srv);
      if (sty) setStylists(sty);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/retell/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        alert(result.message || "Booking failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0C0B07] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 figma-grid-bg opacity-10 scale-50 pointer-events-none" />
            
            {success ? (
              <div className="p-16 text-center space-y-6 relative z-10">
                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-600/30">
                  <CheckCircle2 className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold text-white tracking-tight">Provisioned Successfully</h3>
                <p className="text-white/40 max-w-xs mx-auto font-light leading-relaxed">Infrastructure updated. Booking token #{Math.floor(Math.random()*10000)} has been broadcasted.</p>
              </div>
            ) : (
              <div className="p-10 relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 w-fit mb-3">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Resource Allocation</span>
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-white">Manual <span className="text-gradient-blue">Provisioning</span></h2>
                  </div>
                  <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Customer Identity</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                          required
                          type="text" 
                          placeholder="Full Name"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Uplink Contact</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                          required
                          type="tel" 
                          placeholder="+91 00000 00000"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Service Protocol</label>
                      <div className="relative">
                        <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <select 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white appearance-none"
                          value={formData.service}
                          onChange={e => setFormData({...formData, service: e.target.value})}
                        >
                          <option value="" className="bg-black">Select Protocol</option>
                          {services.map(s => <option key={s.id} value={s.name} className="bg-black">{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Operational Fleet</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <select 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white appearance-none"
                          value={formData.stylist}
                          onChange={e => setFormData({...formData, stylist: e.target.value})}
                        >
                          <option value="" className="bg-black">Any Available</option>
                          {stylists.map(s => <option key={s.id} value={s.name} className="bg-black">{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Target Window</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Cycle Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                          type="time" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                          value={formData.time}
                          onChange={e => setFormData({...formData, time: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-white text-black py-5 rounded-[2rem] font-bold text-lg hover:bg-white/90 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 mt-4"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
                    {loading ? 'Provisioning...' : 'Commit Booking'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
