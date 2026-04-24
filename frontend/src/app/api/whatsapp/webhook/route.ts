import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabase';

/**
 * WhatsApp Webhook Handler
 * Receives incoming messages from Twilio Sandbox
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string; // whatsapp:+91...
    const body = formData.get('Body') as string;
    const profileName = formData.get('ProfileName') as string;
    const mediaUrl = formData.get('MediaUrl0') as string; // If customer sends an image

    console.log(`[WhatsApp Webhook] Received from ${from}: ${body}`);

    // 1. Identify Customer
    const cleanPhone = from.replace('whatsapp:', '');
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('mobile_number', cleanPhone)
      .single();

    // 2. Log Interaction in DB
    if (customer) {
      await supabase.from('conversations').insert([{
        customer_id: customer.id,
        transcript_summary: body,
        sentiment: 'NEUTRAL',
        tenant_id: 1,
        booked_by_ai: false
      }]);
    }

    // 3. Simple Auto-Reply (TwiML)
    const twiml = new twilio.twiml.MessagingResponse();
    
    if (body.toUpperCase() === 'RESCHEDULE') {
      twiml.message('Our AI Receptionist will call you shortly to help you find a new slot. 📞');
    } else if (mediaUrl) {
      twiml.message(`Thanks for the image, ${profileName || 'there'}! Our stylists will review this for your next haircut. ✂️`);
    } else {
      twiml.message(`Hi ${profileName || 'there'}! We've received your message. A team member will get back to you if needed.`);
    }

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
