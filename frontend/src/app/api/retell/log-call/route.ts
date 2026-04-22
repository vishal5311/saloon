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
    const body = await req.json();
    const { call_id, transcript, summary, phone, duration_ms } = body;

    // Identify customer
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile_number', phone)
      .single();

    // Log to conversations
    const { error } = await supabase
      .from('conversations')
      .insert([{
        customer_id: customer?.id,
        incoming_text: transcript,
        transcript_summary: summary,
        channel: 'Voice',
        source_type: 'voice',
        intent: 'call_completion',
        message_sid: call_id // Using call_id as unique reference
      }]);

    if (error) throw error;

    return NextResponse.json({ status: 'logged' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
