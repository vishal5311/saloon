"use client";

import { motion } from "framer-motion";
import { Search, Phone, MoreVertical, Plus, User, Activity, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchCustomers() {
    setLoading(true);
    try {
      const data = await dataService.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error("Fetch customers failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();

    const channel = supabase
      .channel('customers-realtime-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile_number?.includes(searchQuery)
  );

  return (
    <div className="relative space-y-10 max-w-[1400px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/50 backdrop-blur-sm w-fit mb-4">
            <User className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#0C0B07]/60">Customer CRM</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-[#0C0B07]">Network <span className="text-gradient-blue">Registry</span></h2>
          <p className="text-[#5E5E5E] mt-2 font-light">Global customer database and loyalty infrastructure.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#0C0B07] hover:bg-black text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-black/10">
          <Plus className="w-4 h-4" />
          Onboard Customer
        </button>
      </div>

      {/* Filter Area */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0C0B07]/30 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by identity or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/50 border border-[#0C0B07]/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all backdrop-blur-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-[#0C0B07]/5 rounded-2xl">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-[#0C0B07]/40 uppercase tracking-widest">Total: {filteredCustomers.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="tech-card rounded-[2.5rem] overflow-hidden border border-[#0C0B07]/5 relative">
        <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
        {loading ? (
          <div className="py-32 text-center text-[#5E5E5E] animate-pulse flex flex-col items-center gap-4 relative z-10">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="font-medium">Synchronizing Registry...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-32 text-center text-[#5E5E5E] relative z-10">
            <div className="w-16 h-16 bg-[#F6F6F6] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-[#0C0B07]/10" />
            </div>
            <p className="font-light">{searchQuery ? "No records match your criteria." : "Registry is currently empty."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#0C0B07]/5">
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-[#0C0B07]/40">Identity</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-[#0C0B07]/40 text-center">Loyalty Pts</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-[#0C0B07]/40">Flow Volume</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-[#0C0B07]/40">Last Activity</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-[#0C0B07]/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0C0B07]/5">
                {filteredCustomers.map((customer, i) => {
                  const totalBookings = customer.appointments?.length || 0;
                  const lastVisit = customer.appointments?.length > 0 
                    ? new Date(Math.max(...customer.appointments.map((a: any) => new Date(a.start_time).getTime())))
                      .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : "None Recorded";

                  return (
                    <motion.tr 
                      key={customer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-blue-500/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-[#0C0B07]/5 flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm group-hover:border-blue-500/20 group-hover:shadow-md transition-all">
                            {customer.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-[15px] text-[#0C0B07] group-hover:text-blue-600 transition-colors">{customer.full_name}</p>
                            <p className="text-xs text-[#5E5E5E] font-mono mt-0.5">
                              {customer.mobile_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className="text-sm font-bold text-[#0C0B07] bg-blue-500/5 px-3 py-1 rounded-full">
                          {customer.loyalty_points || 0}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-sm text-[#0C0B07]">{totalBookings} Settlements</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-sm text-[#5E5E5E] font-light">{lastVisit}</td>
                      <td className="px-10 py-6 text-right">
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                          Verified
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}
