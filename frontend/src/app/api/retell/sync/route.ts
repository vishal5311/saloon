import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    console.log("[ANTIGRAVITY OS] Sync Request Received (v3 Protocol)");
    
    if (!process.env.RETELL_API_KEY) {
      console.error("[ANTIGRAVITY OS] Missing RETELL_API_KEY");
      return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    let allRetellCalls: any[] = [];
    let hasMore = true;
    let paginationKey: string | null = null;

    console.log("[ANTIGRAVITY OS] Mirroring calls from Retell Infrastructure...");

    while (hasMore) {
      const requestBody: any = {};
      if (paginationKey) {
        requestBody.pagination_key = paginationKey;
      }

      const response = await fetch("https://api.retellai.com/v3/list-calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Retell API v3 Error] Status: ${response.status}, Body: ${errorText}`);
        return NextResponse.json({ error: `Retell API Error: ${response.status}` }, { status: response.status });
      }

      const data = await response.json();
      const items = data.items || [];
      allRetellCalls = [...allRetellCalls, ...items];
      
      paginationKey = data.pagination_key;
      hasMore = data.has_more && paginationKey;
      
      // Safety break to prevent infinite loops in dev
      if (allRetellCalls.length > 500) hasMore = false;
    }
    
    console.log(`[ANTIGRAVITY OS] Retell returned ${allRetellCalls.length} calls. Start deep synchronization...`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const call of allRetellCalls) {
      try {
        // Deep Fetch: Fetch individual call to ensure full transcript and analysis are present
        // Note: Retell v3 uses GET /v2/get-call/{call_id} or GET /v3/get-call/{call_id}
        const fullCallRes = await fetch(`https://api.retellai.com/v2/get-call/${call.call_id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          },
        });

        const fullCall = fullCallRes.ok ? await fullCallRes.json() : call;

        // Safe ID parsing
        let customerId = fullCall.metadata?.customer_id;
        if (typeof customerId === 'string' && /^\d+$/.test(customerId)) {
          customerId = parseInt(customerId, 10);
        } else if (typeof customerId !== 'number') {
          customerId = null;
        }

        const callData: any = {
          retell_call_id: fullCall.call_id,
          customer_id: customerId,
          status: fullCall.call_status || 'unknown',
          transcript: fullCall.transcript || "",
          raw_transcript: fullCall.transcript || "",
          transcript_object: fullCall.transcript_object || [],
          recording_url: fullCall.recording_url || null,
          // v3 often uses .summary, v2 often uses .call_summary
          summary: fullCall.call_analysis?.summary || fullCall.call_analysis?.call_summary || "",
          duration: Math.round((fullCall.duration_ms || 0) / 1000),
          recording_duration: Math.round((fullCall.duration_ms || 0) / 1000),
          sentiment: fullCall.call_analysis?.user_sentiment || "neutral",
          raw_data: fullCall,
          updated_at: new Date().toISOString(),
        };

        if (fullCall.start_timestamp) {
          callData.created_at = new Date(fullCall.start_timestamp).toISOString();
        }

        const { error } = await supabaseServer
          .from("calls")
          .upsert(callData, { onConflict: "retell_call_id" });

        if (error) {
          console.error(`[Sync Error] Call ${fullCall.call_id}:`, error.message);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (innerErr: any) {
        console.error(`[Inner Sync Error] Call ${call?.call_id}:`, innerErr.message);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedCount, 
      errors: errorCount,
      total: allRetellCalls.length 
    });

  } catch (err: any) {
    console.error("[ANTIGRAVITY OS] Critical Sync Crash:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
