"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Loader2, CheckCircle2, Sparkles, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any; // If provided, we are in edit mode
}

export default function CustomerModal({ isOpen, onClose, onSuccess, customer }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    email: '',
    loyalty_points: 0
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name || '',
        mobile_number: customer.mobile_number || '',
        email: customer.email || '',
        loyalty_points: customer.loyalty_points || 0
      });
    } else {
      setFormData({
        full_name: '',
        mobile_number: '',
        email: '',
        loyalty_points: 0
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (customer) {
        // Update
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('customers')
          .insert([{ ...formData, tenant_id: 1 }]);
        if (error) throw error;
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      alert(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
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
            className="relative w-full max-w-lg bg-[#0C0B07] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 figma-grid-bg opacity-10 scale-50 pointer-events-none" />
            
            {success ? (
              <div className="p-16 text-center space-y-6 relative z-10">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-600/30">
                  <CheckCircle2 className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Identity Synchronized</h3>
                <p className="text-white/40 max-w-xs mx-auto font-light leading-relaxed">Registry updated successfully. Node synchronization complete.</p>
              </div>
            ) : (
              <div className="p-10 relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 w-fit mb-3">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Node Management</span>
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-white">{customer ? 'Edit' : 'Onboard'} <span className="text-gradient-blue">Identity</span></h2>
                  </div>
                  <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Full Identity Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Uplink Contact (Mobile)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="tel" 
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                        value={formData.mobile_number}
                        onChange={e => setFormData({...formData, mobile_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Loyalty Allocation (Points)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                      value={formData.loyalty_points}
                      onChange={e => setFormData({...formData, loyalty_points: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    {customer && (
                      <button 
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                      >
                        {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    )}
                    <button 
                      disabled={loading}
                      type="submit"
                      className="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-base hover:bg-white/90 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {loading ? 'Processing...' : customer ? 'Commit Changes' : 'Onboard Identity'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
