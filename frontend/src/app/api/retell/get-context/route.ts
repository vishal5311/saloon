import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

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
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400, headers: corsHeaders });
    }

    // Query customer with related visits and appointments
    // visits table columns: id, visit_date, service_id, customer_id, notes
    // appointments table columns: id, customer_id, service_id, stylist_id, date, start_time, end_time, status, booked_by_ai
    const { data: customer, error } = await supabaseServer
      .from('customers')
      .select('*, visits(visit_date, service_id, notes), appointments(id, date, start_time, status, stylist_id)')
      .eq('mobile_number', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!customer) {
      return NextResponse.json({ 
        exists: false,
        message: "New customer. Introduce yourself as the Salon AI receptionist." 
      }, { headers: corsHeaders });
    }

    // Format context for Retell LLM
    const lastVisit = customer.visits?.[0];
    const lastCompletedAppointment = customer.appointments?.find((a: any) => a.status === 'completed');

    return NextResponse.json({
      exists: true,
      full_name: customer.full_name,
      loyalty_points: customer.loyalty_points,
      last_visit: lastVisit?.visit_date || "N/A",
      favorite_stylist: lastCompletedAppointment?.stylist_id || null,
      context_prompt: `The caller is ${customer.full_name}. They have ${customer.loyalty_points || 0} loyalty points. Their last visit was ${lastVisit?.visit_date || 'never'}. Be friendly and ask if they want to book their usual service.
IMPORTANT RULES:
1. Always use current real date and calculate tomorrow correctly. Never use outdated example dates.
2. Only confirm booking after book_appointment returns success=true.
3. If booking fails, apologize and retry or escalate. Never fake confirmation.`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
