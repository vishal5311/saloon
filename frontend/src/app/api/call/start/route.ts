import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.phone_number) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.retellai.com/v2/create-phone-call",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_number: process.env.RETELL_PHONE_NUMBER, // Ensure this is set in .env
          to_number: body.phone_number,
          agent_id: process.env.RETELL_AGENT_ID,
          metadata: {
            customer_name: body.customer_name,
            customer_id: body.customer_id,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Retell API error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to start call" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error starting call:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
