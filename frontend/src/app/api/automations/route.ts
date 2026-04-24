import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { syncToGoogleCalendar } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Fetch appointment details with customer and service info
    const { data: appointment, error } = await supabaseServer
      .from('appointments')
      .select(`
        *,
        customers (full_name, mobile_number),
        services (name)
      `)
      .eq('id', appointment_id)
      .single();

    if (error || !appointment) {
      console.error('[Automations] Appointment not found', error);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const customer = appointment.customers;
    const service = appointment.services;
    const phone = customer.mobile_number;
    const name = customer.full_name;
    const serviceName = service?.name || 'Hair Salon Service';
    const date = appointment.date.split('T')[0];
    const time = appointment.start_time.split('T')[1]?.substring(0, 5) || 'scheduled time';

    console.log(`[Automations] Triggering for booking #${appointment_id}`);

    // Trigger WhatsApp (Non-blocking)
    sendWhatsAppConfirmation(phone, {
      name: name,
      booking_id: appointment_id,
      service: serviceName,
      date: date,
      time: time
    }).catch(err => console.error('[WhatsApp Automation Failed]', err));

    // Trigger Calendar Sync (Non-blocking)
    syncToGoogleCalendar({
      customer_name: name,
      service: serviceName,
      start_time: appointment.start_time,
      end_time: appointment.end_time || appointment.start_time
    }).catch(err => console.error('[Calendar Automation Failed]', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Automations Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
