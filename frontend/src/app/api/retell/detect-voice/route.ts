import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { call_id, voice_profile, confidence_score } = body;

    console.log(`[Aura OS] Voice Analysis Received for ${call_id}: ${voice_profile} (${confidence_score})`);

    if (!call_id) {
      return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
    }

    // Use UPSERT instead of update to handle cases where the tool is called
    // before the call is synced to the database.
    const { error: callError } = await supabaseServer
      .from("calls")
      .upsert({
        retell_call_id: call_id,
        voice_profile: voice_profile || "neutral",
        confidence_score: confidence_score || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "retell_call_id" });

    if (callError) {
      console.error("[Aura OS] Failed to update call voice profile:", callError);
      throw callError;
    }

    // Optional: Fetch the call to get customer_id and update customer profile too
    const { data: callData } = await supabaseServer
      .from("calls")
      .select("customer_id")
      .eq("retell_call_id", call_id)
      .single();

    if (callData?.customer_id) {
      await supabaseServer
        .from("customers")
        .update({ voice_profile: voice_profile })
        .eq("id", callData.customer_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Aura OS] Voice Detection Sync Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
