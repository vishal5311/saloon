import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { combineDateAndTime, normalizeDate } from '@/lib/date-utils';
import { normalizePhone } from '@/lib/phone-utils';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { syncToGoogleCalendar } from '@/lib/calendar';

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
    { status: 'active', message: 'Retell Book Appointment API is running.' },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const args = body.args || body;
    const { phone, date, time, service, stylist, name: passedName } = args;

    if (!phone || !date || !time) {
      return Response.json(
        { success: false, message: "Phone, date, and time are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    console.log("Booking raw caller:", phone);
    console.log("Booking normalized caller:", normalizedPhone);
    
    const normalizedDateStr = normalizeDate(date);

    // 4. Find/create customer by phone
    let customerId = null;
    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id, mobile_number, full_name')
      .eq('mobile_number', normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabaseServer
        .from('customers')
        .insert([{
          tenant_id: 1,
          full_name: passedName || 'Walk-in Customer',
          mobile_number: normalizedPhone,
          whatsapp_number: normalizedPhone,
          loyalty_points: 0,
          total_spent: 0
        }])
        .select('id')
        .single();
      
      if (custErr || !newCustomer) {
        throw new Error("Failed to create customer record.");
      }
      customerId = newCustomer.id;
    }

    // 5. Find service
    let resolvedServiceId = null;
    let durationMinutes = 30; 
    if (service) {
      const normalizedService = service.trim().toLowerCase();
      let { data: serviceData } = await supabaseServer
        .from('services')
        .select('id, duration_minutes')
        .eq('tenant_id', 1)
        .eq('active', true)
        .ilike('name', normalizedService)
        .limit(1)
        .maybeSingle();
      
      if (!serviceData) {
        const { data: fallbackData } = await supabaseServer
          .from('services')
          .select('id, duration_minutes')
          .eq('tenant_id', 1)
          .eq('active', true)
          .ilike('name', `%${normalizedService}%`)
          .limit(1)
          .maybeSingle();
        serviceData = fallbackData;
      }
      
      if (serviceData) {
        resolvedServiceId = serviceData.id;
        if (serviceData.duration_minutes) durationMinutes = serviceData.duration_minutes;
      } else {
        return Response.json({ success: false, message: "I'm sorry, I couldn't find that specific service in our menu. Could you name it again?" }, { status: 400, headers: corsHeaders });
      }
    }

    // 6. Find stylist (corrected schema: name)
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

    // Duplicate check using DateEngine
    const startTimeFull = combineDateAndTime(normalizedDateStr, time);

    const { data: duplicate } = await supabaseServer
      .from('appointments')
      .select('id')
      .eq('customer_id', customerId)
      .eq('date', `${normalizedDateStr}T00:00:00`)
      .eq('start_time', startTimeFull)
      .eq('status', 'scheduled')
      .limit(1)
      .maybeSingle();

    if (duplicate) {
      const { data: booked } = await supabaseServer
        .from('appointments')
        .select('start_time')
        .eq('date', `${normalizedDateStr}T00:00:00`)
        .not('status', 'eq', 'cancelled');
      
      const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
      const bookedTimes = booked?.map(b => b.start_time?.split('T')[1]?.substring(0, 5)) || [];
      const alternatives = ALL_SLOTS.filter(s => !bookedTimes.includes(s)).slice(0, 3);

      return Response.json({ 
        success: false, 
        message: `It looks like that ${time} slot is already booked. I do have ${alternatives.join(', ')} available though. Which works for you?` 
      }, { status: 400, headers: corsHeaders });
    }

    // 7. Calculate End Time
    const [hours, minutes] = time.split(':').map(Number);
    const endDateObj = new Date(`${normalizedDateStr}T00:00:00`);
    endDateObj.setHours(hours, minutes + durationMinutes, 0, 0);
    
    const endH = String(endDateObj.getHours()).padStart(2, '0');
    const endM = String(endDateObj.getMinutes()).padStart(2, '0');
    const endTimeFull = combineDateAndTime(normalizedDateStr, `${endH}:${endM}`);

    // 8. Insert into appointments
    const { data: appointment, error: appErr } = await supabaseServer
      .from('appointments')
      .insert([{
        tenant_id: 1,
        customer_id: customerId,
        stylist_id: resolvedStylistId,
        service_id: resolvedServiceId,
        date: `${normalizedDateStr}T00:00:00`,
        start_time: startTimeFull,
        end_time: endTimeFull,
        status: 'scheduled',
        booked_by_ai: true
      }])
      .select('id')
      .single();

    if (appErr || !appointment) {
      return Response.json({ 
        success: false, 
        message: "I'm having a little trouble saving that appointment. Could we try one more time?" 
      }, { status: 500, headers: corsHeaders });
    }

    // Trigger Automations (Non-blocking)
    const customerName = passedName || existingCustomer?.full_name || 'Walk-in Customer';
    
    // 1. WhatsApp Confirmation (Centralized Utility)
    (async () => {
      try {
        await sendWhatsAppConfirmation(normalizedPhone, {
          name: customerName,
          booking_id: appointment.id,
          service: service || 'Hair Salon Service',
          date: normalizedDateStr,
          time: time
        });
      } catch (twErr) {
        console.error('[WhatsApp Automation Failed]', twErr);
      }
    })();

    // 2. Calendar Sync
    syncToGoogleCalendar({
      customer_name: customerName,
      service: service || 'Hair Salon Service',
      start_time: startTimeFull,
      end_time: endTimeFull
    }).catch(err => console.error('[Calendar Automation Failed]', err));

    return Response.json({ 
      success: true, 
      message: `Excellent! I've booked your ${service} for ${normalizedDateStr} at ${time}. We'll see you then!`,
      booking_id: appointment.id
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error(error);
    return Response.json({
      success: false,
      message: "Our booking system is acting up slightly. Could you please try again in a moment?"
    }, { status: 500, headers: corsHeaders });
  }
}
