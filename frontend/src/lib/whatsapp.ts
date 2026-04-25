import twilio from 'twilio';

/**
 * Sends a WhatsApp confirmation message, optionally with media (haircut images, etc.)
 */
export async function sendWhatsAppConfirmation(to: string, data: {
  name: string;
  booking_id: string | number;
  service: string;
  date: string;
  time: string;
  mediaUrl?: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    const missing = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!fromNumber) missing.push('TWILIO_WHATSAPP_FROM');
    
    return { 
      success: false, 
      error: `Twilio credentials missing: ${missing.join(', ')}` 
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const messageBody = `Hi ${data.name} ✨

Your appointment is confirmed.

Booking ID: #${data.booking_id}
Service: ${data.service}
Date: ${data.date}
Time: ${data.time}

📍 Aura Salon
⏰ Please arrive 5 minutes early.

Reply RESCHEDULE if needed.

We look forward to seeing you.`;

    const messageOptions: any = {
      body: messageBody,
      from: whatsappFrom,
      to: toFormatted
    };

    if (data.mediaUrl) {
      messageOptions.mediaUrl = [data.mediaUrl];
    }

    const message = await client.messages.create(messageOptions);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('[WhatsApp Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generic helper to send media files via WhatsApp
 */
export async function sendWhatsAppMedia(to: string, mediaUrl: string, caption?: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials missing' };
  }

  try {
    const client = twilio(accountSid, authToken);
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      from: whatsappFrom,
      to: toFormatted,
      body: caption,
      mediaUrl: [mediaUrl]
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
