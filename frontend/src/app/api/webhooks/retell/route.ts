import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, call } = body;

    if (!call || !call.call_id) {
      return NextResponse.json({ error: "Missing call data" }, { status: 400 });
    }

    console.log(`[ANTIGRAVITY OS] Syncing event: ${event} for ${call.call_id}`);

    const customerId = call.metadata?.customer_id;
    
    // Map Retell events to our internal states
    const statusMap: Record<string, string> = {
      'call_started': 'ringing',
      'call_connected': 'connected',
      'call_ended': 'completed',
      'call_analyzed': 'analyzed'
    };

    const currentStatus = statusMap[event] || call.call_status || event;

    const callData: any = {
      retell_call_id: call.call_id,
      customer_id: customerId || null,
      status: currentStatus,
      updated_at: new Date().toISOString(),
      raw_data: call, // Store the full payload for maximum fidelity
    };

    // Capture Transcript Data
    if (call.transcript) {
      callData.transcript = call.transcript;
      callData.raw_transcript = call.transcript;
    }

    if (call.transcript_object) {
      callData.transcript_object = call.transcript_object;
    }

    // Capture Analysis/Recording Data
    if (event === "call_analyzed" || event === "call_ended") {
      callData.recording_url = call.recording_url;
      callData.summary = call.call_analysis?.call_summary || "";
      callData.duration = Math.round((call.duration_ms || 0) / 1000);
      callData.recording_duration = callData.duration;
      callData.sentiment = call.call_analysis?.user_sentiment || "neutral";
      
      // Extract booking actions if present in metadata or custom analysis
      if (call.call_analysis?.custom_analysis_data) {
        callData.booking_actions = call.call_analysis.custom_analysis_data;
      }
    }

    // Update state events timeline
    // Note: We use a Supabase RPC or fetch current state to append
    // For simplicity here, we'll just upsert the latest state
    const { data: existingCall } = await supabaseServer
      .from("calls")
      .select("state_events")
      .eq("retell_call_id", call.call_id)
      .single();

    const newEvent = {
      event,
      status: currentStatus,
      timestamp: new Date().toISOString(),
    };

    const state_events = existingCall?.state_events 
      ? [...existingCall.state_events, newEvent]
      : [newEvent];

    callData.state_events = state_events;

    // Upsert the call data into Supabase
    const { error } = await supabaseServer
      .from("calls")
      .upsert(callData, { onConflict: "retell_call_id" });

    if (error) {
      console.error("[ANTIGRAVITY OS] Sync Error:", error);
      return NextResponse.json({ error: "Failed to sync call data" }, { status: 500 });
    }

    return NextResponse.json({ success: true, call_id: call.call_id });
  } catch (err) {
    console.error("[ANTIGRAVITY OS] Critical Webhook Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
