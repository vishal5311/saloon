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
    { status: 'active', message: 'Retell Get Context API is running. Use POST to interact.' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { phone } = args;
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400, headers: corsHeaders });
    }

    // Query customer with related visits and appointments
    // visits table columns: id, visit_date, service_id, customer_id, notes
    // appointments table columns: id, customer_id, service_id, stylist_id, date, start_time, end_time, status, booked_by_ai
    const { data: customer, error } = await supabaseServer
      .from('customers')
      .select(`
        *, 
        visits(visit_date, service_id, notes), 
        appointments(id, date, start_time, status, stylists(full_name))
      `)
      .eq('mobile_number', phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!customer) {
      return NextResponse.json({ 
        exists: false,
        message: "New customer. Warmly welcome them to the salon and ask how you can help." 
      }, { headers: corsHeaders });
    }

    // Format context for Retell LLM
    const lastVisit = customer.visits?.[0];
    const lastAppointment = customer.appointments?.find((a: any) => a.status === 'completed') || customer.appointments?.[0];
    const lastStylist = lastAppointment?.stylists?.full_name || "one of our experts";

    const historyContext = lastVisit 
      ? `Their last visit was on ${lastVisit.visit_date} with ${lastStylist}.`
      : `They haven't visited us yet, but they are in our system.`;

    return NextResponse.json({
      exists: true,
      full_name: customer.full_name,
      loyalty_points: customer.loyalty_points,
      last_visit: lastVisit?.visit_date || "N/A",
      favorite_stylist: lastStylist,
      context_prompt: `Welcome back ${customer.full_name}! ${historyContext} 
      They have ${customer.loyalty_points || 0} loyalty points. 
      Ask if they want to book a service or have a specific question.
      
      IMPORTANT RULES:
      1. DO NOT ask for their phone number - you already know who they are.
      2. If they want to book, use check_slots first.
      3. Always suggest alternatives if a slot is taken.
      4. Be warm, human, and professional.`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
