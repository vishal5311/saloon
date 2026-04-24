"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, User, Scissors } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BookingModal from "@/components/Dashboard/BookingModal";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  async function fetchAppointments() {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('appointments')
      .select('*, customers(full_name), services(name), stylists(full_name)')
      .eq('date', `${dateStr}T00:00:00`)
      .order('start_time', { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('appointments-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  return (
    <div className="space-y-8">
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTime(undefined);
        }} 
        onSuccess={fetchAppointments}
        initialTime={selectedTime}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-zinc-400 mt-1">Manage your team's schedule and bookings in real-time.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Schedule New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Date Selector Mini Calendar */}
        <div className="glass p-6 rounded-3xl h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() - 1);
                  setSelectedDate(d);
                }}
                className="p-1 hover:bg-white/5 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() + 1);
                  setSelectedDate(d);
                }}
                className="p-1 hover:bg-white/5 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {Array.from({ length: 30 }).map((_, i) => (
              <button 
                key={i} 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(i + 1);
                  setSelectedDate(d);
                }}
                className={`py-2 text-sm rounded-lg transition-colors ${selectedDate.getDate() === i + 1 ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'hover:bg-white/5 text-zinc-400'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Schedule View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between glass p-4 rounded-2xl mb-4">
            <div className="flex items-center gap-4">
              <h4 className="text-lg font-bold">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>
              {selectedDate.toDateString() === new Date().toDateString() && (
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-md uppercase">Today</span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-500 animate-pulse">Syncing with Supabase Live Schedule...</div>
          ) : (
            <div className="space-y-3">
              {timeSlots.map((time, i) => {
                const app = appointments.find(a => a.start_time?.includes(time));
                return (
                  <div key={time} className="flex gap-4 group">
                    <div className="w-16 pt-2 text-sm text-zinc-500 font-medium">{time}</div>
                    <div className="flex-1 min-h-[80px] relative">
                      <div className="absolute left-0 top-0 w-px h-full bg-white/5 group-hover:bg-purple-600/20 transition-colors"></div>
                      {app ? (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`ml-4 p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                            app.booked_by_ai 
                              ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 border-purple-500/30 shadow-lg shadow-purple-900/10' 
                              : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-purple-200">{app.services?.name || 'Unknown Service'}</h5>
                              {app.booked_by_ai && (
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-bold rounded border border-purple-500/30 uppercase tracking-tighter">AI Booked</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{app.start_time?.split('T')[1]?.substring(0, 5)}</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <User className="w-3 h-3" /> {app.customers?.full_name || 'Walk-in'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Scissors className="w-3 h-3" /> {app.stylists?.full_name || 'Any Stylist'}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="ml-4 w-full h-full border-b border-white/5 opacity-20 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => {
                              setSelectedTime(time);
                              setIsModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter hover:text-purple-400"
                          >
                            + Add Slot
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




