import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToday } from '@/lib/date-utils';
import { normalizePhone } from '@/lib/phone-utils';

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
    { status: 'active', message: 'Retell Get Context API is running.' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    
    // Retell passes phone in multiple potential fields depending on config
    const rawPhone = args.phone || args.caller_phone || args.from_number || args.caller_number || "";
    const normalizedPhone = normalizePhone(rawPhone);

    console.log("Incoming raw caller:", rawPhone);
    console.log("Normalized caller:", normalizedPhone);
    
    if (!normalizedPhone || normalizedPhone.length < 5) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400, headers: corsHeaders });
    }

    const today = getToday();

    // Query customer with related visits and appointments using CORRECT schema (stylists(name))
    const { data: customer, error } = await supabaseServer
      .from('customers')
      .select(`
        *, 
        visits(visit_date, service_id, notes), 
        appointments(id, date, start_time, status, stylists(name))
      `)
      .eq('mobile_number', normalizedPhone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!customer) {
      return NextResponse.json({ 
        exists: false,
        today,
        message: `New customer calling from ${phone}. Today is ${today}. Warmly welcome them.` 
      }, { headers: corsHeaders });
    }

    // Format context for Retell LLM
    const lastVisit = customer.visits?.[0];
    const lastAppointment = customer.appointments?.find((a: any) => a.status === 'completed') || customer.appointments?.[0];
    const lastStylist = lastAppointment?.stylists?.name || "one of our experts";

    // Filter upcoming scheduled appointments
    const upcoming = (customer.appointments || [])
      .filter((a: any) => a.status === 'scheduled' && a.date >= `${today}T00:00:00`)
      .map((a: any) => ({
        id: a.id,
        date: a.date.split('T')[0],
        time: a.start_time.split('T')[1].substring(0, 5),
        stylist: a.stylists?.name || "Unknown",
        service: a.services?.name || "Service"
      }));

    const historyContext = lastVisit 
      ? `Their last visit was on ${lastVisit.visit_date} with ${lastStylist}.`
      : `They are a registered customer but haven't visited recently.`;

    const upcomingContext = upcoming.length > 0
      ? `They ALREADY HAVE an upcoming booking: ${upcoming.map(u => `${u.service} on ${u.date} at ${u.time}`).join(', ')}.`
      : `They have no upcoming bookings.`;

    return NextResponse.json({
      exists: true,
      today,
      full_name: customer.full_name,
      loyalty_points: customer.loyalty_points,
      last_visit: lastVisit?.visit_date || "N/A",
      favorite_stylist: lastStylist,
      upcoming_appointments: upcoming,
      context_prompt: `Today is ${today}. The caller is ${customer.full_name}. ${historyContext} 
      ${upcomingContext}
      They have ${customer.loyalty_points || 0} loyalty points. 
      
      CRITICAL INSTRUCTIONS:
      1. If they have an upcoming booking, MENTION IT IMMEDIATELY in the greeting. "I see you're already scheduled for ${upcoming[0]?.service} tomorrow at ${upcoming[0]?.time}."
      2. If they ask to book for the SAME time, tell them they are already booked.
      3. Offer to keep, reschedule, or cancel the existing booking.
      4. Suggest adding a service (hair spa, wash, or facial) to their existing visit.
      5. Greet them warmly: "Welcome back ${customer.full_name}!"`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
