import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njeaekidfetlwcvxqlmm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { status: 'active', message: 'Retell Book Appointment API is running. Use POST to book.' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { phone, full_name, date, time, service, stylist_id } = args;
    const service_id = service;

    if (!phone || !date || !time) {
      return NextResponse.json(
        { error: "phone, date, and time are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Ensure Customer Exists
    let { data: customer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('mobile_number', phone)
      .single();

    if (!customer) {
      const { data: newCust, error: custErr } = await supabaseServer
        .from('customers')
        .insert([{ full_name: full_name || 'Walk-in Customer', mobile_number: phone }])
        .select()
        .single();
      
      if (custErr) throw custErr;
      customer = newCust;
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to create or find customer" }, { status: 500, headers: corsHeaders });
    }

    // 2. Book Appointment
    // appointments columns: id, customer_id, service_id, stylist_id, date, start_time, end_time, status, booked_by_ai
    const startTime = time.includes(':') ? time : `${time}:00:00`;
    const { data: appointment, error: appErr } = await supabaseServer
      .from('appointments')
      .insert([{
        customer_id: customer.id,
        service_id: service_id || null,
        stylist_id: stylist_id || null,
        date,
        start_time: startTime,
        booked_by_ai: true,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (appErr || !appointment) {
      return NextResponse.json({ error: appErr?.message || "Failed to book appointment" }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ 
      success: true, 
      appointment_id: appointment.id,
      message: `Great! I've booked your appointment for ${date} at ${time}. We look forward to seeing you!`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
