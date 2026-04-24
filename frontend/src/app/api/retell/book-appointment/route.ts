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
    const { phone, full_name, date, time, service, stylist } = args;

    if (!phone || !date || !time) {
      return NextResponse.json(
        { success: false, message: "Phone, date, and time are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. CUSTOMER LOOKUP / CREATE
    let customerId = null;
    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('tenant_id', 1)
      .eq('mobile_number', phone)
      .limit(1)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabaseServer
        .from('customers')
        .insert([{
          tenant_id: 1,
          full_name: full_name || 'Walk-in Customer',
          mobile_number: phone,
          whatsapp_number: phone,
          loyalty_points: 0,
          total_spent: 0
        }])
        .select('id')
        .single();
      
      if (custErr || !newCustomer) {
        return NextResponse.json({ success: false, message: "Unable to complete booking right now." }, { status: 500, headers: corsHeaders });
      }
      customerId = newCustomer.id;
    }

    // 2. SERVICE LOOKUP (CASE INSENSITIVE)
    let resolvedServiceId = null;
    let durationMinutes = 30; // default
    if (service) {
      const { data: serviceData } = await supabaseServer
        .from('services')
        .select('id, duration')
        .eq('tenant_id', 1)
        .eq('active', true)
        .ilike('name', service.trim())
        .limit(1)
        .single();
      
      if (serviceData) {
        resolvedServiceId = serviceData.id;
        if (serviceData.duration) durationMinutes = serviceData.duration;
      } else {
        return NextResponse.json({ success: false, message: "Requested service not available." }, { status: 400, headers: corsHeaders });
      }
    }

    // 3. STYLIST LOOKUP (OPTIONAL)
    let resolvedStylistId = null;
    if (stylist) {
      const { data: stylistData } = await supabaseServer
        .from('stylists')
        .select('id')
        .eq('tenant_id', 1)
        .eq('active', true)
        .ilike('name', stylist.trim())
        .limit(1)
        .single();
      
      if (stylistData) {
        resolvedStylistId = stylistData.id;
      }
    }

    // 6. DUPLICATE PREVENTION
    const startTime = time.includes(':') ? time : `${time}:00`;
    const { data: duplicate } = await supabaseServer
      .from('appointments')
      .select('id')
      .eq('customer_id', customerId)
      .eq('date', date)
      .eq('start_time', startTime)
      .eq('status', 'scheduled')
      .limit(1)
      .single();

    if (duplicate) {
      return NextResponse.json({ success: false, message: "You already have an appointment at this time." }, { status: 400, headers: corsHeaders });
    }

    // 4. APPOINTMENT INSERT
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes || 0, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    const endHours = String(startDate.getHours()).padStart(2, '0');
    const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}:00`;

    const { data: appointment, error: appErr } = await supabaseServer
      .from('appointments')
      .insert([{
        tenant_id: 1,
        customer_id: customerId,
        stylist_id: resolvedStylistId,
        service_id: resolvedServiceId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
        booked_by_ai: true
      }])
      .select('id')
      .single();

    if (appErr || !appointment) {
      return NextResponse.json({ success: false, message: "Unable to complete booking right now." }, { status: 500, headers: corsHeaders });
    }

    // 10. RETELL COMPATIBILITY
    return NextResponse.json({ 
      success: true, 
      booking_id: appointment.id,
      message: "Appointment booked successfully."
    }, { headers: corsHeaders });

  } catch (err: any) {
    // 7. ERROR HANDLING
    return NextResponse.json({ success: false, message: "Unable to complete booking right now." }, { status: 500, headers: corsHeaders });
  }
}
