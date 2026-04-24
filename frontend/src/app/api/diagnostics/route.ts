import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: any = {
    supabase: { status: 'checking', details: null },
    twilio: { status: 'checking', details: null },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      RETELL_AGENT_ID: !!process.env.RETELL_AGENT_ID,
    }
  };

  // 1. Check Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
    );
    const { data, error } = await supabase.from('stylists').select('count', { count: 'exact', head: true });
    if (error) throw error;
    diagnostics.supabase = { status: 'ok', details: `Found ${data === null ? 0 : data} stylists` };
  } catch (e: any) {
    diagnostics.supabase = { status: 'error', details: e.message };
  }

  // 2. Check Twilio
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials missing');
    }
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    diagnostics.twilio = { status: 'ok', details: 'Account verified' };
  } catch (e: any) {
    diagnostics.twilio = { status: 'error', details: e.message };
  }

  return NextResponse.json(diagnostics);
}
