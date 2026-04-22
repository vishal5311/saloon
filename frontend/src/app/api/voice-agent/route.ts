import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, payload } = body;

    console.log(`[Voice Agent] Action: ${action} for ${phone}`);

    // 1. GET CONTEXT: AI Agent fetches customer history
    if (action === 'get_context') {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*, visits(*), appointments(*)')
        .eq('mobile_number', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return NextResponse.json({ 
        customer,
        exists: !!customer,
        suggested_message: customer 
          ? `Welcome back ${customer.full_name}! I see your last visit was on ${new Date(customer.last_visit_at).toLocaleDateString()}. Should I book your usual service?` 
          : "Welcome! I'm your AI assistant. How can I help you book your first appointment today?"
      });
    }

    // 2. BOOK APPOINTMENT: Direct DB insertion from AI
    if (action === 'book_appointment') {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          customer_id: payload.customer_id,
          service_id: payload.service_id,
          stylist_id: payload.stylist_id,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: 'scheduled'
        }])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, appointment: data[0] });
    }

    // 3. LOG CALL: Save transcript to Dashboard
    if (action === 'log_call') {
      await supabase
        .from('conversations')
        .insert([{
          customer_id: payload.customer_id,
          incoming_text: payload.transcript,
          channel: 'Voice',
          intent: payload.intent,
          sentiment: payload.sentiment
        }]);

      return NextResponse.json({ status: 'logged' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('[Voice Agent Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support CORS for Voice Agent providers (Vapi/Retell)
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
