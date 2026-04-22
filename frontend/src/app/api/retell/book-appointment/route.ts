import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { phone, full_name, date, time, service_id, stylist_id } = await req.json();

    // 1. Ensure Customer Exists
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile_number', phone)
      .single();

    if (!customer) {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert([{ full_name, mobile_number: phone }])
        .select()
        .single();
      
      if (custErr) throw custErr;
      customer = newCust;
    }

    // 2. Book Appointment
    const { data: appointment, error: appErr } = await supabase
      .from('appointments')
      .insert([{
        customer_id: customer.id,
        service_id: service_id || "75a349c2-5536-47b7-959c-6a0d4817a021", // Fallback to generic service
        stylist_id: stylist_id || "717ca165-8025-45a8-9d45-6677c74f51e2", // Fallback to any stylist
        date,
        start_time: time.includes(':') ? time : `${time}:00:00`,
        booked_by_ai: true,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (appErr) throw appErr;

    return NextResponse.json({ 
      success: true, 
      appointment_id: appointment.id,
      message: `Great! I've booked your appointment for ${date} at ${time}. We look forward to seeing you!`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
