import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export async function POST(req: Request) {
  try {
    const { date } = await req.json();
    
    if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

    const { data: booked } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('date', date)
      .not('status', 'eq', 'cancelled');

    const bookedTimes = booked?.map(b => b.start_time.substring(0, 5)) || [];
    const availableSlots = ALL_SLOTS.filter(s => !bookedTimes.includes(s));

    return NextResponse.json({ 
      date,
      available_slots: availableSlots,
      message: availableSlots.length > 0 
        ? `We have slots available at ${availableSlots.join(', ')}.` 
        : "Sorry, we are fully booked for that day."
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
