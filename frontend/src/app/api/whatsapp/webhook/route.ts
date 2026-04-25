import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

/**
 * WhatsApp Webhook Handler
 * Receives incoming messages from Twilio Sandbox
 * Handles hairstyle selection (1-4), RESCHEDULE, and general messages
 */

// Hairstyle mapping — must match the menu sent in send-hairstyle-menu
const HAIRSTYLE_MAP: Record<string, string> = {
  '1': 'Classic Fade',
  '2': 'Textured Crop',
  '3': 'Slick Back',
  '4': 'Modern Layer Cut',
};

export async function POST(req: Request) {
  // Initialize Supabase inside handler to avoid build-time crashes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://njeaekidfetlwcvxqlmm.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  const supabaseServer = createClient(supabaseUrl, supabaseKey);

  try {
    const formData = await req.formData();
    const from = formData.get('From') as string; // whatsapp:+91...
    const body = (formData.get('Body') as string || '').trim();
    const profileName = formData.get('ProfileName') as string;
    const mediaUrl = formData.get('MediaUrl0') as string; // If customer sends an image

    console.log(`[WhatsApp Webhook] Received from ${from}: ${body}`);

    // Identify Customer
    const cleanPhone = from.replace('whatsapp:', '');
    const { data: customer } = await supabaseServer
      .from('customers')
      .select('*')
      .eq('mobile_number', cleanPhone)
      .single();

    const twiml = new twilio.twiml.MessagingResponse();

    // ─── HAIRSTYLE SELECTION FLOW ────────────────────────────
    if (HAIRSTYLE_MAP[body]) {
      const selectedStyle = HAIRSTYLE_MAP[body];

      if (customer) {
        // 1. Update customer preferred_style
        await supabaseServer
          .from('customers')
          .update({ preferred_style: selectedStyle })
          .eq('id', customer.id);

        // 2. Update the most recent scheduled appointment with selected_style
        const { data: latestAppointment } = await supabaseServer
          .from('appointments')
          .select('id, date, start_time, services(name)')
          .eq('customer_id', customer.id)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestAppointment) {
          await supabaseServer
            .from('appointments')
            .update({ selected_style: selectedStyle })
            .eq('id', latestAppointment.id);

          const appointmentDate = latestAppointment.date?.split('T')[0] || 'your appointment';
          const appointmentTime = latestAppointment.start_time?.includes('T')
            ? latestAppointment.start_time.split('T')[1].substring(0, 5)
            : 'scheduled time';

          twiml.message(
            `Perfect ${customer.full_name || profileName || 'there'} ✨\n\n` +
            `Hairstyle selected: ${selectedStyle}\n` +
            `Added to your ${(latestAppointment as any).services?.name || 'haircut'} booking for ${appointmentDate} at ${appointmentTime}.\n\n` +
            `Your stylist will be prepared with this style reference.\n\n` +
            `We look forward to seeing you! 💈`
          );
        } else {
          twiml.message(
            `Great choice — ${selectedStyle}! ✨\n\n` +
            `We've saved this as your preferred style. It will be applied to your next booking automatically.`
          );
        }

        // 3. Log the interaction
        await supabaseServer.from('conversations').insert([{
          tenant_id: 1,
          customer_id: customer.id,
          incoming_text: `Selected hairstyle: ${selectedStyle}`,
          transcript_summary: `Customer selected ${selectedStyle} via WhatsApp`,
          channel: 'WhatsApp',
          source_type: 'whatsapp',
          intent: 'hairstyle_selected',
          sentiment: 'POSITIVE'
        }]);

      } else {
        twiml.message(
          `Thanks for your choice — ${selectedStyle}! ✨\n` +
          `We couldn't find your profile yet. Please call us to book, and we'll save this preference for you.`
        );
      }

    // ─── RESCHEDULE ────────────────────────────────────────
    } else if (body.toUpperCase() === 'RESCHEDULE') {
      if (customer) {
        await supabaseServer.from('conversations').insert([{
          tenant_id: 1,
          customer_id: customer.id,
          incoming_text: body,
          transcript_summary: 'Customer requested reschedule via WhatsApp',
          channel: 'WhatsApp',
          source_type: 'whatsapp',
          intent: 'reschedule',
          sentiment: 'NEUTRAL'
        }]);
      }
      twiml.message('Our AI Receptionist will call you shortly to help you find a new slot. 📞');

    // ─── IMAGE RECEIVED ────────────────────────────────────
    } else if (mediaUrl) {
      if (customer) {
        await supabaseServer.from('conversations').insert([{
          tenant_id: 1,
          customer_id: customer.id,
          incoming_text: `[Image received] ${body || ''}`,
          transcript_summary: 'Customer sent a reference image via WhatsApp',
          channel: 'WhatsApp',
          source_type: 'whatsapp',
          intent: 'style_reference',
          sentiment: 'NEUTRAL'
        }]);
      }
      twiml.message(`Thanks for the image, ${profileName || 'there'}! Our stylists will review this for your next haircut. ✂️`);

    // ─── GENERAL MESSAGE ───────────────────────────────────
    } else {
      if (customer) {
        await supabaseServer.from('conversations').insert([{
          tenant_id: 1,
          customer_id: customer.id,
          incoming_text: body,
          transcript_summary: body,
          channel: 'WhatsApp',
          source_type: 'whatsapp',
          intent: 'general',
          sentiment: 'NEUTRAL'
        }]);
      }
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
