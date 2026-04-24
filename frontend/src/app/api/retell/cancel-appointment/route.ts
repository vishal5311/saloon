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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const args = body.args || body;
    const { appointment_id, reason } = args;

    if (!appointment_id) {
      return Response.json({ success: false, message: "Appointment ID is required." }, { status: 400, headers: corsHeaders });
    }

    const { error } = await supabaseServer
      .from('appointments')
      .update({ status: 'cancelled', notes: reason || 'Cancelled via AI' })
      .eq('id', appointment_id);

    if (error) throw error;

    return Response.json({ 
      success: true, 
      message: "I've successfully cancelled that appointment for you. Would you like to book a different time or is there anything else I can help with?" 
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error(error);
    return Response.json({
      success: false,
      message: "I'm sorry, I couldn't cancel the appointment right now. Could you please hold for a moment or try again later?"
    }, { status: 500, headers: corsHeaders });
  }
}
