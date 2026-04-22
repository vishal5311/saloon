"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
    customer_id: "",
    service_id: "",
    stylist_id: "",
    date: new Date().toISOString().split('T')[0],
    start_time: initialTime || "10:00:00",
    end_time: "11:00:00",
    status: "scheduled"
  });

  useEffect(() => {
    if (initialTime) {
      setNewApp(prev => ({ ...prev, start_time: initialTime.includes(':') ? (initialTime.length === 5 ? `${initialTime}:00` : initialTime) : `${initialTime}:00` }));
    }
  }, [initialTime]);

  useEffect(() => {
    async function fetchData() {
      const [custRes, servRes, stylRes] = await Promise.all([
        supabase.from('customers').select('id, full_name'),
        supabase.from('services').select('id, name'),
        supabase.from('stylists').select('id, full_name')
      ]);

      if (custRes.data) setCustomers(custRes.data);
      if (servRes.data) setServices(servRes.data);
      if (stylRes.data) setStylists(stylRes.data);
    }

    if (isOpen) fetchData();
  }, [isOpen]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { error } = await supabase
      .from('appointments')
      .insert([newApp]);

    if (!error) {
      onSuccess?.();
      onClose();
    } else {
      alert("Error booking appointment: " + error.message);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New Booking</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Customer</label>
                <select 
                  required
                  value={newApp.customer_id}
                  onChange={(e) => setNewApp({...newApp, customer_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.full_name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Service</label>
                  <select 
                    required
                    value={newApp.service_id}
                    onChange={(e) => setNewApp({...newApp, service_id: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  >
                    <option value="">Select Service</option>
                    {services.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Stylist</label>
                  <select 
                    required
                    value={newApp.stylist_id}
                    onChange={(e) => setNewApp({...newApp, stylist_id: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  >
                    <option value="">Select Stylist</option>
                    {stylists.map(st => <option key={st.id} value={st.id} className="bg-zinc-900">{st.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Time</label>
                  <select 
                    required
                    value={newApp.start_time.substring(0, 5)}
                    onChange={(e) => setNewApp({...newApp, start_time: `${e.target.value}:00`})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  >
                    {timeSlots.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date"
                    value={newApp.date}
                    onChange={(e) => setNewApp({...newApp, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button 
                disabled={isSaving}
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Appointment"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
