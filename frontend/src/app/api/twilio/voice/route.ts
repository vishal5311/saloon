import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get('From');
    
    // Retell Voice API expects a specific TwiML structure to connect
    // You would typically use the Retell SDK here, or raw TwiML if using a custom connector
    // For this implementation, we return TwiML that redirects to Retell's WebSocket
    
    const agentId = process.env.RETELL_AGENT_ID || "your_retell_agent_id";
    
    // Example TwiML for Retell Integration
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://api.retellai.com/audio-websocket/${agentId}">
            <Parameter name="caller_phone" value="${from}" />
        </Stream>
    </Connect>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
