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
    { status: 'active', message: 'Voice Agent API is running. Use POST with { "action": "get_context|book_appointment|log_call", "phone": "...", "payload": {...} }' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, payload } = body;

    console.log(`[Voice Agent] Action: ${action} for ${phone}`);

    // 1. GET CONTEXT: AI Agent fetches customer history
    if (action === 'get_context') {
      const { data: customer, error } = await supabaseServer
        .from('customers')
        .select('*, visits(visit_date, service_id, notes), appointments(id, date, start_time, status)')
        .eq('mobile_number', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return NextResponse.json({ 
        customer,
        exists: !!customer,
        suggested_message: customer 
          ? `Welcome back ${customer.full_name}! I see your last visit was on ${customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString() : 'a while ago'}. Should I book your usual service?` 
          : "Welcome! I'm your AI assistant. How can I help you book your first appointment today?"
      }, { headers: corsHeaders });
    }

    // 2. BOOK APPOINTMENT: Direct DB insertion from AI
    if (action === 'book_appointment') {
      // appointments columns: id, customer_id, service_id, stylist_id, date, start_time, end_time, status, booked_by_ai
      const { data, error } = await supabaseServer
        .from('appointments')
        .insert([{
          tenant_id: 1,
          customer_id: payload.customer_id,
          service_id: payload.service_id || null,
          stylist_id: payload.stylist_id || null,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time || null,
          status: 'scheduled',
          booked_by_ai: true
        }])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, appointment: data?.[0] }, { headers: corsHeaders });
    }

    // 3. LOG CALL: Save transcript to Dashboard
    if (action === 'log_call') {
      // conversations columns: id, customer_id, incoming_text, channel, source_type, intent, sentiment, message_sid, transcript_summary, created_at
      const { error } = await supabaseServer
        .from('conversations')
        .insert([{
          tenant_id: 1,
          customer_id: payload.customer_id || null,
          incoming_text: payload.transcript || '',
          channel: 'Voice',
          source_type: 'voice',
          intent: payload.intent || 'general',
          sentiment: payload.sentiment || null
        }]);

      if (error) throw error;
      return NextResponse.json({ status: 'logged' }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error: any) {
    console.error('[Voice Agent Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
