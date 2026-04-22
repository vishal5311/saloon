import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { phone, reason } = await req.json();

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile_number', phone)
      .single();

    // Insert an 'intent: handoff' record to trigger real-time UI alert
    await supabase
      .from('conversations')
      .insert([{
        customer_id: customer?.id,
        incoming_text: `[SYSTEM: HUMAN HANDOFF REQUESTED] Reason: ${reason || 'Customer asked for a person'}`,
        channel: 'Voice',
        source_type: 'voice',
        intent: 'handoff'
      }]);

    return NextResponse.json({ 
      success: true, 
      message: "Transferring you to our salon manager now. Please hold a moment."
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
