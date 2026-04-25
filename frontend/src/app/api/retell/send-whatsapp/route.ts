import { NextResponse } from 'next/server';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
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
      }, { status: 200, headers: corsHeaders }); // Using 200 as per common webhook patterns, but message says error
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

    // 3. Send via Twilio
    const normalizedPhone = normalizePhone(phone);
    const result = await sendWhatsAppConfirmation(normalizedPhone, {
      name: name || 'Customer',
      booking_id: booking_id || 'N/A',
      service: service || 'Service',
      date: date || 'Scheduled',
      time: time || 'Requested',
      mediaUrl: mediaUrl
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: "sent",
        message: "WhatsApp confirmation sent."
      }, { status: 200, headers: corsHeaders });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to send WhatsApp"
      }, { status: 200, headers: corsHeaders });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500, headers: corsHeaders });
  }
}
