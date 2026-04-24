"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, UserPlus, MoreVertical, Phone, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ full_name: "", mobile_number: "", city: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*, appointments(id, start_time)')
      .eq('tenant_id', 1)
      .order('created_at', { ascending: false });

    if (!error) {
      setCustomers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCustomers();

    const subscription = supabase
      .channel('customers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { error } = await supabase
      .from('customers')
      .insert([newCustomer]);

    if (!error) {
      setIsModalOpen(false);
      setNewCustomer({ full_name: "", mobile_number: "", city: "" });
      fetchCustomers();
    } else {
      alert("Error adding customer: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer CRM</h2>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            Direct Supabase Real-time Feed
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[2rem] border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Customer</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCustomer.full_name}
                    onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})}
                    placeholder="Enter customer name"
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Mobile Number</label>
                  <input 
                    required
                    type="tel" 
                    value={newCustomer.mobile_number}
                    onChange={(e) => setNewCustomer({...newCustomer, mobile_number: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">City</label>
                  <input 
                    type="text" 
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                  />
                </div>
                <button 
                  disabled={isSaving}
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Create Customer"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by name, phone or tag..." 
              className="bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600/50 w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Connecting to Supabase...</div>
        ) : customers.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold">Database is Empty</h4>
              <p className="text-sm text-zinc-500">Your Salon is ready. New records will appear here live.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4 text-center">Loyalty Pts</th>
                <th className="px-8 py-4">Total Bookings</th>
                <th className="px-8 py-4">Last Visit</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((customer, i) => {
                const totalBookings = customer.appointments?.length || 0;
                const lastVisit = customer.appointments?.length > 0 
                  ? new Date(Math.max(...customer.appointments.map((a: any) => new Date(a.start_time).getTime())))
                    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : "Never";

                return (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                          {customer.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{customer.full_name}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.mobile_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center font-medium text-sm text-yellow-500/80">{customer.loyalty_points || 0}</td>
                    <td className="px-8 py-4 font-bold text-sm text-purple-400">{totalBookings}</td>
                    <td className="px-8 py-4 text-sm text-zinc-400">{lastVisit}</td>
                    <td className="px-8 py-4 text-right">
                      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

