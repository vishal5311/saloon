import { supabase } from './supabase';
import { formatDate, getToday, normalizeDate } from './date-utils';

const TENANT_ID = 1;

/**
 * REUSABLE FRONTEND DATA LAYER
 */

export const dataService = {
  /**
   * Fetch Dashboard Statistics
   */
  async getDashboardStats() {
    const todayStr = getToday();
    const todayTimestamp = `${todayStr}T00:00:00`;

    const [customers, todayApps, pending, totalApps, aiCalls] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).eq('date', todayTimestamp),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).eq('status', 'scheduled'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).gte('created_at', todayTimestamp)
    ]);

    return {
      totalCustomers: customers.count || 0,
      todayBookings: todayApps.count || 0,
      pendingAppointments: pending.count || 0,
      totalBookings: totalApps.count || 0,
      aiCallsToday: aiCalls.count || 0,
      errors: {
        customers: customers.error,
        todayApps: todayApps.error,
        pending: pending.error,
        totalApps: totalApps.error,
        aiCalls: aiCalls.error
      }
    };
  },

  /**
   * Fetch Appointments for a specific date
   */
  async getAppointmentsByDate(date: string | Date) {
    const dateStr = typeof date === 'string' ? normalizeDate(date) : formatDate(date);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, customers(full_name), services(name), stylists(name)')
      .eq('tenant_id', TENANT_ID)
      .eq('date', `${dateStr}T00:00:00`)
      .order('start_time', { ascending: true });

    if (error) console.error("DataService Error (getAppointmentsByDate):", error);
    return data || [];
  },

  /**
   * Fetch All Customers
   */
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*, appointments(id, start_time)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (error) console.error("DataService Error (getCustomers):", error);
    return data || [];
  },

  /**
   * Fetch All AI Call Logs
   */
  async getCalls() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, customers(full_name, mobile_number)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (error) console.error("DataService Error (getCalls):", error);
    return data || [];
  },

  /**
   * Find nearest upcoming appointment to determine default calendar view
   */
  async getNearestUpcomingAppointment() {
    const todayTimestamp = `${getToday()}T00:00:00`;
    const { data, error } = await supabase
      .from('appointments')
      .select('date')
      .eq('tenant_id', TENANT_ID)
      .gte('date', todayTimestamp)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) console.error("DataService Error (getNearestUpcoming):", error);
    return data?.date || null;
  }
};
