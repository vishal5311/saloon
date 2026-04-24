"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Calendar, User, Scissors, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { combineDateAndTime } from "@/lib/date-utils";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTime?: string;
}

export default function BookingModal({ isOpen, onClose, onSuccess, initialTime }: BookingModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  
  const [newApp, setNewApp] = useState({
    tenant_id: 1,
    customer_id: "",
    service_id: "",
    stylist_id: "",
    date: new Date().toISOString().split('T')[0],
    start_time: initialTime || "10:00",
    end_time: "11:00",
    status: "scheduled"
  });

  useEffect(() => {
    if (initialTime) {
      setNewApp(prev => ({ ...prev, start_time: initialTime }));
    }
  }, [initialTime]);

  useEffect(() => {
    async function fetchData() {
      const [custRes, servRes, stylRes] = await Promise.all([
        supabase.from('customers').select('id, full_name'),
        supabase.from('services').select('id, name'),
        supabase.from('stylists').select('id, name')
      ]);

      if (custRes.data) setCustomers(custRes.data);
      if (servRes.data) setServices(servRes.data);
      if (stylRes.data) setStylists(stylRes.data);
    }

    if (isOpen) fetchData();
  }, [isOpen]);

  const [error, setError] = useState<string | null>(null);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    const bookingPayload = {
      ...newApp,
      date: `${newApp.date}T00:00:00`,
      start_time: combineDateAndTime(newApp.date, newApp.start_time),
      end_time: combineDateAndTime(newApp.date, newApp.end_time)
    };

    const { data: appointment, error: appErr } = await supabase
      .from('appointments')
      .insert([bookingPayload])
      .select('id')
      .single();

    if (!appErr && appointment) {
      fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id })
      }).catch(err => console.error('Failed to trigger automations', err));

      onSuccess?.();
      onClose();
    } else {
      let msg = appErr?.message || "Failed to create appointment";
      if (msg.includes("duplicate key value") || msg.includes("already have an appointment")) {
        const customerName = customers.find(c => c.id === newApp.customer_id)?.full_name || "Customer";
        const time = newApp.start_time.substring(0, 5);
        msg = `${customerName} already has a booking at ${time}.`;
      }
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
    setIsSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg tech-card p-10 rounded-[3rem] border border-[#0C0B07]/5 shadow-2xl overflow-hidden"
          >
            {/* Background Grid */}
            <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full badge-gradient-border bg-white/50 w-fit">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-[#0C0B07]/60">Booking Node</span>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#0C0B07]">Provision Appointment</h3>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-[#0C0B07]/5 rounded-2xl transition-colors">
                  <X className="w-5 h-5 text-[#0C0B07]/30" />
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-3 overflow-hidden"
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleBooking} className="space-y-6">
                {/* Customer Select */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest px-1">
                    <User className="w-3 h-3" /> Customer Identity
                  </label>
                  <select 
                    required
                    value={newApp.customer_id}
                    onChange={(e) => setNewApp({...newApp, customer_id: e.target.value})}
                    className="w-full bg-white border border-[#0C0B07]/5 rounded-2xl py-4 px-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a customer from registry</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest px-1">
                      <Scissors className="w-3 h-3" /> Service
                    </label>
                    <select 
                      required
                      value={newApp.service_id}
                      onChange={(e) => setNewApp({...newApp, service_id: e.target.value})}
                      className="w-full bg-white border border-[#0C0B07]/5 rounded-2xl py-4 px-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Service</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest px-1">
                      <User className="w-3 h-3" /> Fleet Member
                    </label>
                    <select 
                      required
                      value={newApp.stylist_id}
                      onChange={(e) => setNewApp({...newApp, stylist_id: e.target.value})}
                      className="w-full bg-white border border-[#0C0B07]/5 rounded-2xl py-4 px-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Stylist</option>
                      {stylists.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest px-1">
                      <Clock className="w-3 h-3" /> Slot Time
                    </label>
                    <select 
                      required
                      value={newApp.start_time.substring(0, 5)}
                      onChange={(e) => setNewApp({...newApp, start_time: `${e.target.value}:00`})}
                      className="w-full bg-white border border-[#0C0B07]/5 rounded-2xl py-4 px-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      {timeSlots.map(t => <option key={t} value={t}>{t} IST</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-[#0C0B07]/40 uppercase tracking-widest px-1">
                      <Calendar className="w-3 h-3" /> Ledger Date
                    </label>
                    <input 
                      type="date"
                      value={newApp.date}
                      onChange={(e) => setNewApp({...newApp, date: e.target.value})}
                      className="w-full bg-white border border-[#0C0B07]/5 rounded-2xl py-4 px-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <button 
                  disabled={isSaving}
                  type="submit" 
                  className="w-full bg-[#0C0B07] hover:bg-black text-white font-bold py-5 rounded-[1.5rem] transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Confirm Appointment</span>
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
