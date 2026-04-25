import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

// Manually load .env from the project root or frontend folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    RETELL_API_KEY: process.env.RETELL_API_KEY,
    RETELL_AGENT_ID: process.env.RETELL_AGENT_ID,
  }
};

export default nextConfig;
