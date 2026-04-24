import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToday } from '@/lib/date-utils';

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
    const phone = args.phone || args.caller_phone;
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400, headers: corsHeaders });
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
      .eq('mobile_number', phone)
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

    const lastVisit = customer.visits?.[0];
    const lastAppointment = customer.appointments?.find((a: any) => a.status === 'completed') || customer.appointments?.[0];
    const lastStylist = lastAppointment?.stylists?.name || "one of our experts";

    const historyContext = lastVisit 
      ? `Their last visit was on ${lastVisit.visit_date} with ${lastStylist}.`
      : `They are a registered customer but haven't visited recently.`;

    return NextResponse.json({
      exists: true,
      today,
      full_name: customer.full_name,
      loyalty_points: customer.loyalty_points,
      last_visit: lastVisit?.visit_date || "N/A",
      favorite_stylist: lastStylist,
      context_prompt: `Today is ${today}. The caller is ${customer.full_name}. ${historyContext} 
      They have ${customer.loyalty_points || 0} loyalty points. 
      
      CRITICAL INSTRUCTIONS:
      1. Use TODAY (${today}) as the absolute reference for all relative dates (tomorrow, next week).
      2. NEVER use sample years like 2024.
      3. Greet them by name: "Welcome back ${customer.full_name}!"
      4. Suggest booking with ${lastStylist} if they liked their last visit.`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
