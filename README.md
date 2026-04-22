# Salon AI CRM - Supabase Edition (Hassle-Free)

A serverless, real-time Salon Management system powered entirely by Supabase.

---

## 🏗️ Architecture
- **Frontend**: Next.js 15 + Tailwind CSS + Framer Motion.
- **Database**: Supabase PostgreSQL (Real-time enabled).
- **Backend**: Supabase Edge Functions (Replace the need for local Python APIs).

---

## 🚀 Getting Started

### 1. Database Setup
1. Go to your **Supabase SQL Editor**.
2. Run the SQL script provided in our conversation (creates 12 tables).

### 2. Frontend Launch
1. Ensure your `.env` in the `frontend` folder has your Supabase URL and Anon Key.
2. Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000).

### 🎙️ Deploying the Voice Agent API
Your Voice Agent (Vapi/Retell) needs a live URL. We use **Supabase Edge Functions**.

1. Install Supabase CLI: `npm install supabase --save-dev`
2. Link your project: `npx supabase link --project-ref [YOUR_PROJECT_REF]`
3. Deploy the function: 
   ```bash
   npx supabase functions deploy voice-agent
   ```
4. **URL to give your Voice Agent:** 
   `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/voice-agent`

---

## 🤖 Voice Agent API Actions
The deployed function supports these payloads:
- `action: "get_context"`: Fetch customer history.
- `action: "book_appointment"`: Create a new booking.
- `action: "log_call"`: Log a transcript to the dashboard.

---

## 📂 Project Structure
- `/frontend`: All UI and Real-time logic.
- `/supabase/functions/voice-agent`: The "Brain" for your Voice Agents.
