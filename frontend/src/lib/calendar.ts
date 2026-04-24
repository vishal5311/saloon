import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

interface CalendarEventData {
  customer_name: string;
  service: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
}

export async function syncToGoogleCalendar(data: CalendarEventData) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      console.warn('[Calendar] Skipping - Google credentials not fully configured');
      return { success: false, error: 'Missing credentials' };
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES
    });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log(`[Calendar] Creating event for ${data.customer_name} - ${data.service}`);

    const event = {
      summary: `${data.customer_name} - ${data.service}`,
      description: `Appointment for ${data.service} at Aura Salon.`,
      start: {
        dateTime: data.start_time,
        timeZone: 'Asia/Kolkata', // Default to IST since user is in +05:30
      },
      end: {
        dateTime: data.end_time,
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log(`[Calendar] Event created: ${response.data.htmlLink}`);
    return { success: true, link: response.data.htmlLink };
  } catch (error) {
    console.error('[Calendar Error]', error);
    return { success: false, error };
  }
}
