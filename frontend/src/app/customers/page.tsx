"use client";

import { motion } from "framer-motion";
import { Search, Phone, MoreVertical, Plus, User, Activity, Sparkles, RefreshCw, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";
import CustomerModal from "@/components/Dashboard/CustomerModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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

  const handleOpenEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  return (
    <div className="relative space-y-10 max-w-[1400px] mx-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 figma-grid-bg opacity-10 fixed pointer-events-none" />

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-gradient-border bg-white/5 backdrop-blur-sm w-fit mb-4">
            <User className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Customer CRM</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-white">Network <span className="text-gradient-blue">Registry</span></h2>
          <p className="text-white/40 mt-2 font-light">Global customer database and loyalty infrastructure.</p>
        </div>
        
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Onboard Customer
        </button>
      </div>

      {/* Filter Area */}
      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by identity or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all backdrop-blur-sm text-white"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total: {filteredCustomers.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="tech-card rounded-[2.5rem] overflow-hidden border border-white/5 relative">
        <div className="absolute inset-0 figma-grid-bg opacity-5 scale-50 pointer-events-none" />
        {loading ? (
          <div className="py-32 text-center text-white/40 animate-pulse flex flex-col items-center gap-4 relative z-10">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="font-medium">Synchronizing Registry...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-32 text-center text-white/40 relative z-10">
            <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-white/10" />
            </div>
            <p className="font-light">{searchQuery ? "No records match your criteria." : "Registry is currently empty."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-white/30">Identity</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-white/30 text-center">Loyalty Pts</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-white/30">Flow Volume</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-white/30">Last Activity</th>
                  <th className="px-10 py-6 text-[10px] uppercase font-bold tracking-widest text-white/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => handleOpenEdit(customer)}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-blue-400 group-hover:border-blue-500/50 transition-all">
                            {customer.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-[15px] text-white group-hover:text-blue-400 transition-colors">
                              {['walk-in customer', 'guest', 'unknown', 'null', 'blank'].includes(customer.full_name?.toLowerCase()) 
                                ? "New Client" 
                                : (customer.full_name || "New Client")}
                            </p>
                            <p className="text-xs text-white/30 font-mono mt-0.5">
                              {customer.mobile_number}
                            </p>
                            {customer.preferred_style && (
                              <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {customer.preferred_style}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className="text-sm font-bold text-white bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                          {customer.loyalty_points || 0}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-bold text-sm text-white/60">{totalBookings} Settlements</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-sm text-white/40 font-light">{lastVisit}</td>
                      <td className="px-10 py-6 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(customer);
                          }}
                          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/10 group-hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
