import { NextResponse } from 'next/server';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { normalizePhone } from '@/lib/phone-utils';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Handle GET to prevent 404 and provide info
export async function GET() {
  return NextResponse.json({ 
    success: false, 
    message: "POST method required for WhatsApp confirmation." 
  }, { status: 405, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // 1. Parse JSON body safely
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ 
        success: false, 
        status: "error",
        message: "Invalid JSON body" 
      }, { status: 400, headers: corsHeaders });
    }

    // 2. Extract arguments (supporting both direct and Retell 'args' wrapper)
    const args = body.args || body;
    const { phone, name, booking_id, service, date, time, mediaUrl } = args;

    // 3. Validation
    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        status: "error",
        message: "Phone number is required." 
      }, { status: 400, headers: corsHeaders });
    }

    // 4. Send Message
    const normalizedPhone = normalizePhone(phone);
    
    console.log(`[Send WhatsApp] Triggered for ${normalizedPhone} (Booking #${booking_id})`);

    const result = await sendWhatsAppConfirmation(normalizedPhone, {
      name: name || 'Customer',
      booking_id: booking_id || 'N/A',
      service: service || 'Salon Service',
      date: date || 'Scheduled',
      time: time || 'Requested',
      mediaUrl: mediaUrl
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        status: "sent", 
        message: "WhatsApp confirmation sent.",
        sid: result.sid
      }, { status: 200, headers: corsHeaders });
    } else {
      return NextResponse.json({ 
        success: false, 
        status: "error", 
        message: result.error || "Failed to send WhatsApp message" 
      }, { status: 500, headers: corsHeaders });
    }

  } catch (error: any) {
    console.error('[Send WhatsApp API Error]:', error.message);
    return NextResponse.json({ 
      success: false, 
      status: "error",
      message: "Internal Server Error: " + error.message 
    }, { status: 500, headers: corsHeaders });
  }
}
