"use client";

import { motion } from "framer-motion";
import { Search, Phone, MoreVertical, Plus } from "lucide-react";
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-zinc-400 mt-1">Manage your customer database and loyalty program.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/10">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 animate-pulse">Syncing Customer CRM...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            {searchQuery ? "No customers match your search." : "Your customer database is empty."}
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
              {filteredCustomers.map((customer, i) => {
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
