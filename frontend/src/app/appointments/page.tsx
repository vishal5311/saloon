"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, User, Scissors, Calendar, Activity, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { dataService } from "@/lib/data-service";
import { getToday, formatDate, normalizeDate } from "@/lib/date-utils";
import BookingModal from "@/components/Dashboard/BookingModal";

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  async function initializeView() {
    setLoading(true);
    try {
      const nearestDate = await dataService.getNearestUpcomingAppointment();
      if (nearestDate) {
        setSelectedDate(new Date(nearestDate));
      } else {
        setSelectedDate(new Date());
      }
    } catch (e) {
      console.error("View initialization failed:", e);
    }
  }

  async function fetchAppointments() {
    setLoading(true);
    try {
      const data = await dataService.getAppointmentsByDate(selectedDate);
      setAppointments(data);
    } catch (e) {
      console.error("Fetch appointments failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initializeView();
  }, []);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('appointments-realtime-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  return (
    <div className="relative space-y-10 max-w-[1400px] mx-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 figma-grid-bg opacity-10 fixed pointer-events-none" />

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTime(undefined);
        }} 
        onSuccess={fetchAppointments}
        initialTime={selectedTime}
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-4">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Fleet Scheduler</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-white">Network <span className="text-gradient-blue">Schedule</span></h2>
          <p className="text-white/40 mt-2 font-light">Real-time booking infrastructure and team allocation.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Provision Slot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        {/* Left Sidebar: Date Picker */}
        <div className="tech-card p-8 rounded-[2.5rem] h-fit">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-bold text-white">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() - 1);
                  setSelectedDate(d);
                }}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() + 1);
                  setSelectedDate(d);
                }}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-white/20 mb-6 uppercase tracking-widest">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {Array.from({ length: 31 }).map((_, i) => (
              <button 
                key={i} 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(i + 1);
                  setSelectedDate(d);
                }}
                className={`py-3 text-sm font-medium rounded-xl transition-all ${selectedDate.getDate() === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-110' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between tech-card p-6 rounded-[2rem]">
            <div className="flex items-center gap-4">
              <h4 className="text-xl font-semibold tracking-tight text-white">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>
              {formatDate(selectedDate) === getToday() && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-500/20">Current Window</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{appointments.length} Operations</span>
            </div>
          </div>

          {loading ? (
            <div className="py-32 text-center text-white/30 animate-pulse font-light">Synchronizing Ledger...</div>
          ) : (
            <div className="space-y-4">
              {timeSlots.map((time, i) => {
                const app = appointments.find(a => a.start_time?.includes(time));
                return (
                  <div key={time} className="flex gap-6 group">
                    <div className="w-16 pt-3 text-xs font-bold text-white/20 group-hover:text-blue-500 transition-colors uppercase tracking-widest">{time}</div>
                    <div className="flex-1 min-h-[100px] relative pb-4">
                      <div className="absolute left-0 top-0 w-[2px] h-full bg-white/5 group-hover:bg-blue-500/20 transition-colors rounded-full"></div>
                      {app ? (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`ml-6 p-6 rounded-3xl border transition-all cursor-pointer hover:bg-white/[0.02] ${
                            app.booked_by_ai 
                              ? 'bg-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/5' 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <h5 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">{app.services?.name || 'Standard Service'}</h5>
                              <span className="px-2 py-0.5 bg-white/5 text-white/20 text-[9px] font-bold rounded-lg border border-white/5 uppercase tracking-widest">ID: #{app.id}</span>
                              {app.booked_by_ai && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">AI Node</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-white/20 uppercase tracking-widest font-mono">{app.start_time?.split('T')[1]?.substring(0, 5)} IST</span>
                          </div>
                          <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2.5 text-sm text-white/40 font-light">
                              <User className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-white/80">{app.customers?.full_name || 'Walk-in'}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-white/40 font-light">
                              <Scissors className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-white/80">{app.stylists?.name || 'Fleet Member'}</span>
                            </div>
                            {app.selected_style && (
                              <div className="flex items-center gap-2.5 text-sm">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="font-medium text-purple-300">Style: {app.selected_style}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="ml-6 w-full h-full border-b border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <button 
                            onClick={() => {
                              setSelectedTime(time);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest px-4 py-2 bg-blue-500/5 rounded-xl transition-all border border-blue-500/10 hover:bg-blue-500/10"
                          >
                            <Plus className="w-3 h-3" />
                            Provision Slot
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
