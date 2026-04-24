import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeDate } from '@/lib/date-utils';

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
    { status: 'active', message: 'Retell Check Slots API is running. Use POST with { "date": "YYYY-MM-DD" } to check availability.' },
    { headers: corsHeaders }
  );
}

const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { date } = args;
    
    const normalizedDate = normalizeDate(date);
    const { data: booked } = await supabaseServer
      .from('appointments')
      .select('start_time')
      .eq('date', `${normalizedDate}T00:00:00`)
      .not('status', 'eq', 'cancelled');

    const bookedTimes = booked?.map(b => b.start_time?.split('T')[1]?.substring(0, 5)) || [];
    const availableSlots = ALL_SLOTS.filter(s => !bookedTimes.includes(s));

    return NextResponse.json({ 
      date,
      available_slots: availableSlots,
      message: availableSlots.length > 0 
        ? `I have looked at our schedule for ${date}, and we have openings at ${availableSlots.join(', ')}. Which of these would you prefer?` 
        : `I'm so sorry, but it looks like we are fully booked on ${date}. Would you like me to check the following day for you?`
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
