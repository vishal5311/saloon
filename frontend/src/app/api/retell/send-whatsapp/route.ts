import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { normalizePhone } from '@/lib/phone-utils';

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
  return NextResponse.json({ success: false, message: "POST method required" }, { status: 405, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // 1. Validate Environment Variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !whatsappFrom) {
      return NextResponse.json({ 
        success: false, 
        message: "Twilio credentials missing" 
      }, { status: 200, headers: corsHeaders });
    }

    // 2. Parse Payload
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400, headers: corsHeaders });
    }

    const args = body.args || body;
    const { phone, name, booking_id, service, date, time, mediaUrl } = args;

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400, headers: corsHeaders });
    }

    // 3. Send via Twilio SDK
    const client = twilio(accountSid, authToken);
    const normalizedPhone = normalizePhone(phone);
    
    const toFormatted = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
    const fromFormatted = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`;

    const messageBody = `Hi ${name || 'Customer'} ✨\n\nYour appointment is confirmed.\n\nBooking ID: #${booking_id || 'N/A'}\nService: ${service || 'Service'}\nDate: ${date || 'Scheduled'}\nTime: ${time || 'Requested'}\n\n📍 Aura Salon\n⏰ Please arrive 5 minutes early.\n\nReply RESCHEDULE if needed.\n\nWe look forward to seeing you.`;

    const messageOptions: any = {
      body: messageBody,
      from: fromFormatted,
      to: toFormatted
    };

    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const message = await client.messages.create(messageOptions);

    return NextResponse.json({
      success: true,
      status: "sent",
      message: "WhatsApp confirmation sent.",
      sid: message.sid
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[WhatsApp Route Error]:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 200, headers: corsHeaders });
  }
}
