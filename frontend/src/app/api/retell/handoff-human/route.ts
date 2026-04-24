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
    { status: 'active', message: 'Retell Handoff Human API is running. Use POST to trigger human handoff.' },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { phone, reason } = args;

    let customerId = null;

    if (phone) {
      const { data: customer } = await supabaseServer
        .from('customers')
        .select('id')
        .eq('mobile_number', phone)
        .single();
      customerId = customer?.id || null;
    }

    // Insert a 'handoff' intent record to trigger real-time UI alert
    // conversations columns: id, customer_id, incoming_text, channel, source_type, intent, sentiment, message_sid, transcript_summary, created_at
    const { error } = await supabaseServer
      .from('conversations')
      .insert([{
        customer_id: customerId,
        incoming_text: `[SYSTEM: HUMAN HANDOFF REQUESTED] Reason: ${reason || 'Customer asked for a person'}`,
        channel: 'Voice',
        source_type: 'voice',
        intent: 'handoff'
      }]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Transferring you to our salon manager now. Please hold a moment."
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
