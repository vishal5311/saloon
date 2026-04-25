import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize inside the function to avoid build-time execution errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, message: "Supabase credentials missing" }, { status: 500 });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const tablesToClear = ['appointments', 'conversations', 'customers'];
    const results: Record<string, string> = {};

    for (const table of tablesToClear) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .not('id', 'is', null);

      if (error) {
         console.error(`Error deleting ${table}:`, error);
         results[table] = 'Error: ' + error.message;
      } else {
         results[table] = 'Cleared';
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "System data cleared successfully. Services and Stylists were preserved.", 
      results 
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
