import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { combineDateAndTime, normalizeDate } from '@/lib/date-utils';

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
    const { appointment_id, new_date, new_time } = args;

    if (!appointment_id || !new_date || !new_time) {
      return Response.json({ success: false, message: "ID, new date, and new time are required." }, { status: 400, headers: corsHeaders });
    }

    const normalizedDate = normalizeDate(new_date);
    const startTimeFull = combineDateAndTime(normalizedDate, new_time);

    // Calculate End Time (assume 30 mins for now, or fetch original service duration)
    const [hours, minutes] = new_time.split(':').map(Number);
    const endDateObj = new Date(`${normalizedDate}T00:00:00`);
    endDateObj.setHours(hours, minutes + 30, 0, 0);
    const endH = String(endDateObj.getHours()).padStart(2, '0');
    const endM = String(endDateObj.getMinutes()).padStart(2, '0');
    const endTimeFull = combineDateAndTime(normalizedDate, `${endH}:${endM}`);

    const { error } = await supabaseServer
      .from('appointments')
      .update({ 
        date: `${normalizedDate}T00:00:00`,
        start_time: startTimeFull,
        end_time: endTimeFull,
        notes: 'Rescheduled via AI'
      })
      .eq('id', appointment_id);

    if (error) throw error;

    return Response.json({ 
      success: true, 
      message: `Perfect! I've moved your appointment to ${normalizedDate} at ${new_time}. Is there anything else you'd like to adjust?` 
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error(error);
    return Response.json({
      success: false,
      message: "I'm having a bit of trouble rescheduling right now. Could you please hold or try again?"
    }, { status: 500, headers: corsHeaders });
  }
}
