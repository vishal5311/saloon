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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const args = body.args || body;
    const { phone, date, time, service, stylist } = args;

    if (!phone || !date || !time) {
      return Response.json(
        { success: false, message: "Phone, date, and time are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Find/create customer by phone
    let customerId = null;
    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('tenant_id', 1)
      .eq('mobile_number', phone)
      .limit(1)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabaseServer
        .from('customers')
        .insert([{
          tenant_id: 1,
          full_name: 'Walk-in Customer',
          mobile_number: phone,
          whatsapp_number: phone,
          loyalty_points: 0,
          total_spent: 0
        }])
        .select('id')
        .single();
      
      if (custErr || !newCustomer) {
        throw new Error(custErr?.message || "Failed to create customer");
      }
      customerId = newCustomer.id;
    }

    // 5. Find service by case-insensitive name
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
        .maybeSingle();
      
      if (serviceData) {
        resolvedServiceId = serviceData.id;
        if (serviceData.duration) durationMinutes = serviceData.duration;
      } else {
        return Response.json({ success: false, message: "Requested service not available." }, { status: 400, headers: corsHeaders });
      }
    }

    // 6. Find stylist optional
    let resolvedStylistId = null;
    if (stylist) {
      const { data: stylistData } = await supabaseServer
        .from('stylists')
        .select('id')
        .eq('tenant_id', 1)
        .eq('active', true)
        .ilike('name', stylist.trim())
        .limit(1)
        .maybeSingle();
      
      if (stylistData) {
        resolvedStylistId = stylistData.id;
      }
    }

    // Duplicate check
    const startTimeStr = time.includes(':') ? time : `${time}:00`;
    const startTimeFull = `${date}T${startTimeStr}:00`;

    const { data: duplicate } = await supabaseServer
      .from('appointments')
      .select('id')
      .eq('customer_id', customerId)
      .eq('date', `${date}T00:00:00`)
      .eq('start_time', startTimeFull)
      .eq('status', 'scheduled')
      .limit(1)
      .maybeSingle();

    if (duplicate) {
      return Response.json({ success: false, message: "You already have an appointment at this time." }, { status: 400, headers: corsHeaders });
    }

    // 7. Convert timestamps
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const endDate = new Date(`${date}T00:00:00`);
    endDate.setHours(hours, minutes + durationMinutes, 0, 0);
    
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const endTimeFull = `${date}T${endHours}:${endMinutes}:00`;

    const appointmentDate = `${date}T00:00:00`;

    // 8. Insert into appointments
    const { data: appointment, error: appErr } = await supabaseServer
      .from('appointments')
      .insert([{
        tenant_id: 1,
        customer_id: customerId,
        stylist_id: resolvedStylistId,
        service_id: resolvedServiceId,
        date: appointmentDate,
        start_time: startTimeFull,
        end_time: endTimeFull,
        status: 'scheduled',
        reminder_sent: false,
        booked_by_ai: true
      }])
      .select('id')
      .single();

    if (appErr || !appointment) {
      throw new Error(appErr?.message || "Failed to insert appointment");
    }

    // 9. Return
    return Response.json({ 
      success: true, 
      booking_id: appointment.id
    }, { headers: corsHeaders });

  } catch (error: any) {
    // 10. REAL catch block
    console.error(error);

    return Response.json({
      success: false,
      message: String(error.message),
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null
    }, { status: 500, headers: corsHeaders });
  }
}
