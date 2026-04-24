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
  mediaUrl?: string; // Optional URL for haircut images or brochures
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  // Use TWILIO_WHATSAPP_FROM if available, fallback to TWILIO_PHONE_NUMBER
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER || '+12134444772';

  try {
    if (!accountSid || !authToken) {
      console.error('[WhatsApp] Configuration Error: Missing Twilio Account SID or Auth Token');
      return { success: false, error: 'Missing credentials' };
    }

    const client = twilio(accountSid, authToken);
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`[WhatsApp] Attempting to send message from ${whatsappFrom} to ${toFormatted} for Booking #${data.booking_id}`);

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

    // Add media if provided
    if (data.mediaUrl) {
      messageOptions.mediaUrl = [data.mediaUrl];
    }

    const message = await client.messages.create(messageOptions);

    console.log(`[WhatsApp] Success! Message SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('[WhatsApp] Twilio API Error:', {
      code: error.code,
      message: error.message,
      moreInfo: error.moreInfo
    });
    return { success: false, error: error.message };
  }
}

/**
 * Generic helper to send media files via WhatsApp
 */
export async function sendWhatsAppMedia(to: string, mediaUrl: string, caption?: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER || '+12134444772';

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
    console.error('[WhatsApp Media] Error:', error.message);
    return { success: false, error: error.message };
  }
}
