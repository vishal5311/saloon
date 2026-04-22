import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS Headers for global access by Voice Agents
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Initialize Supabase using environment variables
  // @ts-ignore: Deno is a global in the Edge Function environment
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  // @ts-ignore: Deno is a global in the Edge Function environment
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json()
    const { action, phone, payload } = body

    console.log(`Action: ${action} for phone: ${phone}`)

    // 1. GET CONTEXT: Detailed customer history for AI Brain
    if (action === 'get_context') {
      const { data: customer, error } = await supabase
        .from('customers')
        .select(`
          *,
          visits(id, visit_date, amount_paid, service_id, services(name)),
          appointments(id, date, start_time, status),
          conversations(id, incoming_text, created_at)
        `)
        .eq('mobile_number', phone)
        .order('created_at', { foreignTable: 'conversations', ascending: false })
        .limit(5, { foreignTable: 'conversations' })
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!customer) {
        return new Response(
          JSON.stringify({ exists: false, message: "New customer detected." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate Favorite Stylist (simplistic logic: most visited)
      const { data: stylists } = await supabase
        .from('visits')
        .select('stylist_id')
        .eq('customer_id', customer.id)
      
      const stylistCounts = stylists?.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.stylist_id] = (acc[curr.stylist_id] || 0) + 1;
        return acc;
      }, {});
      
      const favoriteStylistId = stylistCounts 
        ? Object.keys(stylistCounts).reduce((a, b) => stylistCounts[a] > stylistCounts[b] ? a : b) 
        : null;

      return new Response(
        JSON.stringify({ 
          exists: true,
          customer: {
            id: customer.id,
            full_name: customer.full_name,
            total_spent: customer.total_spent,
            loyalty_points: customer.loyalty_points || 0
          },
          last_visit: customer.visits?.[0] || null,
          favorite_stylist_id: favoriteStylistId,
          recent_conversations: customer.conversations || [],
          suggested_message: `Welcome back ${customer.full_name}! I see your last visit was for a ${customer.visits?.[0]?.services?.name || 'service'}. Would you like to book something similar today?`
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. BOOK APPOINTMENT: AI Agent creates a booking directly
    if (action === 'book_appointment') {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          customer_id: payload.customer_id,
          service_id: payload.service_id,
          stylist_id: payload.stylist_id,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: 'scheduled',
          booked_by_ai: true
        }])
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, appointment: data[0] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. LOG CONVERSATION: Store call transcript with AI metadata
    if (action === 'log_call') {
      await supabase
        .from('conversations')
        .insert([{
          customer_id: payload.customer_id,
          incoming_text: payload.transcript,
          transcript_summary: payload.summary,
          channel: 'Voice',
          source_type: 'voice',
          intent: payload.intent,
          sentiment: payload.sentiment
        }])

      return new Response(
        JSON.stringify({ status: 'logged' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. RECOMMEND SERVICE: Suggest based on history
    if (action === 'recommend_service') {
      const { data: history } = await supabase
        .from('visits')
        .select('service_id, services(name, description)')
        .eq('customer_id', payload.customer_id)
        .order('visit_date', { ascending: false })
        .limit(3)

      return new Response(
        JSON.stringify({ 
          recommendations: history?.map((h: any) => h.services) || [],
          reason: "Based on your frequent visits for these services."
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action not detected' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


