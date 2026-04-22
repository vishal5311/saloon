import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Clean phone number (strip + or spaces if necessary, but we'll assume exact match for now)
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*, visits(visit_date, total_amount), appointments(*)')
      .eq('mobile_number', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json({ 
        exists: false,
        message: "New customer. Introduce yourself as the Salon AI receptionist." 
      });
    }

    // Format context for Retell LLM
    const lastVisit = customer.visits?.[0];
    const favoriteStylist = customer.appointments?.find((a: any) => a.status === 'completed')?.stylist_id;

    return NextResponse.json({
      exists: true,
      full_name: customer.full_name,
      loyalty_points: customer.loyalty_points,
      last_visit: lastVisit?.visit_date || "N/A",
      context_prompt: `The caller is ${customer.full_name}. They have ${customer.loyalty_points} loyalty points. Their last visit was ${lastVisit?.visit_date || 'never'}. Be friendly and ask if they want to book their usual service.`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
