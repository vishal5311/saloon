import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { normalizePhone } from '@/lib/phone-utils';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Hairstyle catalog with direct image URLs
const HAIRSTYLE_CATALOG = [
  { id: 1, name: 'Classic Fade', imageUrl: 'https://www.hairstyleslife.com/wp-content/uploads/2018/03/Hairstyles-for-Men-2018-Best-Haircut-Ideas-for-Guys-2.jpg' },
  { id: 2, name: 'Textured Crop', imageUrl: 'https://haircutinspiration.com/wp-content/uploads/2022/11/Haircuts-for-Men-High-Fade-with-Brush-Up.jpg' },
  { id: 3, name: 'Slick Back', imageUrl: 'https://i.pinimg.com/originals/24/6e/fb/246efb566a4d881783aef3bbb36a66db.jpg' },
  { id: 4, name: 'Modern Layer Cut', imageUrl: 'https://cdn.shopify.com/s/files/1/2384/0833/files/1_Quiff_1024x1024.jpg?v=1668876008' },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { status: 'active', message: 'Hairstyle menu API is running.', catalog: HAIRSTYLE_CATALOG },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !whatsappFrom) {
      return NextResponse.json({ success: false, message: 'Twilio credentials missing' }, { status: 200, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
    }

    const args = body.args || body;
    const { phone, name, booking_id, service, date, time } = args;

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400, headers: corsHeaders });
    }

    const client = twilio(accountSid, authToken);
    const normalizedPhone = normalizePhone(phone);
    const toFormatted = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
    const fromFormatted = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`;

    // Message 1: Intro text
    await client.messages.create({
      body: `Hi ${name || 'there'} ✨\n\nChoose your hairstyle for your ${service || 'haircut'} on ${date || 'your appointment'} at ${time || 'scheduled time'}:`,
      from: fromFormatted,
      to: toFormatted
    });

    // Messages 2-5: Send each hairstyle image
    for (const style of HAIRSTYLE_CATALOG) {
      await client.messages.create({
        body: `${style.id}. ${style.name}`,
        from: fromFormatted,
        to: toFormatted,
        mediaUrl: [style.imageUrl]
      });
    }

    // Message 6: Selection prompt
    await client.messages.create({
      body: `Reply with:\n1 = Classic Fade\n2 = Textured Crop\n3 = Slick Back\n4 = Modern Layer Cut`,
      from: fromFormatted,
      to: toFormatted
    });

    return NextResponse.json({
      success: true,
      status: 'sent',
      message: 'Hairstyle menu sent via WhatsApp.'
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[Hairstyle Menu Error]:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 200, headers: corsHeaders });
  }
}
