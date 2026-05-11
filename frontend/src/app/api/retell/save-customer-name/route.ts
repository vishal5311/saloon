import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { normalizePhone } from '@/lib/phone-utils';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const args = body.args || body;
    const { phone, name } = args;

    if (!phone || !name) {
      return NextResponse.json(
        { success: false, message: "Phone and name are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    console.log("Saving name for caller:", normalizedPhone, "Name:", name);

    const { error } = await supabaseServer
      .from('customers')
      .update({ full_name: name })
      .eq('mobile_number', normalizedPhone);

    if (error) {
      console.error("Error updating customer name:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, message: `Saved name ${name} for ${normalizedPhone}` }, { headers: corsHeaders });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to save customer name."
    }, { status: 500, headers: corsHeaders });
  }
}
