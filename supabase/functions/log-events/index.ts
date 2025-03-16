// Follow this setup guide to integrate the Deno runtime:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  source: string;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { level, message, data, source } = await req.json() as LogEvent;
    
    // Validate required fields
    if (!level || !message || !source) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: level, message, and source' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Timestamp if not provided
    const timestamp = new Date().toISOString();
    
    // Format log entry
    const logEntry = {
      timestamp,
      level,
      source,
      message,
      ...data || {}
    };
    
    // Log to Supabase function logs (will appear in the Supabase dashboard)
    console[level](JSON.stringify(logEntry));
    
    // You could also store in a database table for persistent logging
    // const supabaseClient = createClient(
    //   Deno.env.get('SUPABASE_URL') ?? '',
    //   Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    //   { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    // );
    //
    // await supabaseClient.from('logs').insert(logEntry);
    
    return new Response(
      JSON.stringify({ success: true, timestamp }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Error processing log request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Invalid request format' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}); 