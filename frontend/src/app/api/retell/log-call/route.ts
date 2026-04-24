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
    { status: 'active', message: 'Retell Log Call API is running. Use POST to log a completed call.' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { call_id, transcript, summary, phone } = args;

    // Identify customer
    let customerId = null;
    if (phone) {
      const { data: customer } = await supabaseServer
        .from('customers')
        .select('id')
        .eq('mobile_number', phone)
        .single();
      customerId = customer?.id || null;
    }

    // Log to conversations
    // conversations columns: id, customer_id, incoming_text, channel, source_type, intent, sentiment, message_sid, transcript_summary, created_at
    const { error } = await supabaseServer
      .from('conversations')
      .insert([{
        customer_id: customerId,
        incoming_text: transcript || '',
        transcript_summary: summary || '',
        channel: 'Voice',
        source_type: 'voice',
        intent: 'call_completion',
        message_sid: call_id || null
      }]);

    if (error) throw error;

    return NextResponse.json({ status: 'logged' }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
