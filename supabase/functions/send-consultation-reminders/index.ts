import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Restricted CORS - this is a service-only endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReminderRequest {
  consultationId?: string; // Optional - if provided, sends reminder for specific consultation
  hoursBeforeReminder?: number; // How many hours before to look for consultations (default: 24)
}

// Generic error messages
const ErrorMessages = {
  UNAUTHORIZED: "Unauthorized access",
  INTERNAL_ERROR: "An error occurred processing your request",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-consultation-reminders function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should only be called by internal systems (cron jobs)
    // For user-initiated requests, require authentication
    const authHeader = req.headers.get("Authorization");
    const internalKey = req.headers.get("X-Internal-Key");
    const expectedInternalKey = Deno.env.get("INTERNAL_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let userId: string | null = null;
    let isInternalCall = false;

    // Check for internal API key (for scheduled/cron invocations)
    if (expectedInternalKey && internalKey === expectedInternalKey) {
      isInternalCall = true;
      console.log("Internal API key verified");
    } 
    // Check for user authentication (for user-initiated specific reminder)
    else if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error("Auth verification failed:", authError);
        return new Response(
          JSON.stringify({ error: ErrorMessages.UNAUTHORIZED }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = authUser.id;
      console.log("Authenticated user:", userId);
    } else {
      console.error("No valid authentication provided");
      return new Response(
        JSON.stringify({ error: ErrorMessages.UNAUTHORIZED }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({})) as ReminderRequest;
    const hoursBeforeReminder = body.hoursBeforeReminder || 24;

    let consultations: any[] = [];

    if (body.consultationId) {
      // For specific consultation, verify user has access
      if (userId) {
        // Check if user is part of this consultation
        const { data, error } = await supabase
          .from('consultations')
          .select(`
            id,
            scheduled_at,
            duration_minutes,
            meeting_url,
            notes,
            status,
            user_id,
            firm_id,
            case_id,
            cases!inner(title),
            law_firms!inner(firm_name, user_id)
          `)
          .eq('id', body.consultationId)
          .eq('status', 'scheduled')
          .single();

        if (error) throw error;
        
        // Verify the user is either the client or the firm owner
        if (data) {
          const lawFirm = data.law_firms as unknown as { firm_name: string; user_id: string };
          const isFirmOwner = lawFirm?.user_id === userId;
          const isClient = data.user_id === userId;
          
          if (!isFirmOwner && !isClient) {
            return new Response(
              JSON.stringify({ error: "You don't have access to this consultation" }),
              { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
          consultations = [data];
        }
      } else if (isInternalCall) {
        // Internal call can access any consultation
        const { data, error } = await supabase
          .from('consultations')
          .select(`
            id,
            scheduled_at,
            duration_minutes,
            meeting_url,
            notes,
            status,
            user_id,
            firm_id,
            case_id,
            cases!inner(title),
            law_firms!inner(firm_name, user_id)
          `)
          .eq('id', body.consultationId)
          .eq('status', 'scheduled')
          .single();

        if (error) throw error;
        if (data) {
          consultations = [data];
        }
      }
    } else {
      // Batch processing - only allowed for internal calls
      if (!isInternalCall) {
        return new Response(
          JSON.stringify({ error: "Batch processing requires internal API key" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find consultations happening within the reminder window
      const now = new Date();
      const reminderWindowStart = new Date(now.getTime() + (hoursBeforeReminder - 1) * 60 * 60 * 1000);
      const reminderWindowEnd = new Date(now.getTime() + hoursBeforeReminder * 60 * 60 * 1000);

      console.log(`Looking for consultations between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          meeting_url,
          notes,
          status,
          user_id,
          firm_id,
          case_id,
          cases!inner(title),
          law_firms!inner(firm_name, user_id)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', reminderWindowStart.toISOString())
        .lte('scheduled_at', reminderWindowEnd.toISOString());

      if (error) throw error;
      consultations = data || [];
    }

    console.log(`Found ${consultations?.length || 0} consultations to send reminders for`);

    const emailPromises = (consultations || []).flatMap(async (consultation: any) => {
      const scheduledDate = new Date(consultation.scheduled_at);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const caseTitle = consultation.cases?.title || 'Your case';
      const firmName = consultation.law_firms?.firm_name || 'Law Firm';
      const meetingUrl = consultation.meeting_url || '';

      // Get user profile (client)
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', consultation.user_id)
        .single();

      // Get firm profile
      const { data: firmProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', consultation.law_firms?.user_id)
        .single();

      const emailPromises = [];

      // Send reminder to client
      if (clientProfile?.email) {
        emailPromises.push(
          resend.emails.send({
            from: "Debriefed <onboarding@resend.dev>",
            to: [clientProfile.email],
            subject: `⏰ Reminder: Consultation tomorrow with ${firmName}`,
            html: generateReminderEmail(
              clientProfile.full_name || 'there',
              firmName,
              caseTitle,
              formattedDate,
              formattedTime,
              meetingUrl,
              consultation.duration_minutes || 30,
              'client'
            ),
          }).then(() => {
            console.log(`Reminder sent to client: ${clientProfile.email}`);
            return { type: 'client', email: clientProfile.email, success: true };
          }).catch((error) => {
            console.error(`Failed to send to client ${clientProfile.email}:`, error);
            return { type: 'client', email: clientProfile.email, success: false };
          })
        );
      }

      // Send reminder to firm
      if (firmProfile?.email) {
        emailPromises.push(
          resend.emails.send({
            from: "Debriefed <onboarding@resend.dev>",
            to: [firmProfile.email],
            subject: `⏰ Reminder: Consultation tomorrow for "${caseTitle}"`,
            html: generateReminderEmail(
              firmProfile.full_name || firmName,
              clientProfile?.full_name || 'Client',
              caseTitle,
              formattedDate,
              formattedTime,
              meetingUrl,
              consultation.duration_minutes || 30,
              'firm'
            ),
          }).then(() => {
            console.log(`Reminder sent to firm: ${firmProfile.email}`);
            return { type: 'firm', email: firmProfile.email, success: true };
          }).catch((error) => {
            console.error(`Failed to send to firm ${firmProfile.email}:`, error);
            return { type: 'firm', email: firmProfile.email, success: false };
          })
        );
      }

      return emailPromises;
    });

    const allPromises = (await Promise.all(emailPromises)).flat();
    const results = await Promise.all(allPromises);
    const successCount = results.filter((r: any) => r?.success).length;

    console.log(`Successfully sent ${successCount} reminder emails`);

    return new Response(JSON.stringify({ 
      success: true, 
      reminders_sent: successCount,
      total_consultations: consultations?.length || 0 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-consultation-reminders:", error);
    return new Response(
      JSON.stringify({ error: ErrorMessages.INTERNAL_ERROR }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateReminderEmail(
  recipientName: string,
  otherPartyName: string,
  caseTitle: string,
  date: string,
  time: string,
  meetingUrl: string,
  duration: number,
  recipientType: 'client' | 'firm'
): string {
  const withText = recipientType === 'client' 
    ? `with <strong>${otherPartyName}</strong>` 
    : `with client <strong>${otherPartyName}</strong>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #d4a84b; margin: 0; font-size: 28px;">⚖️ DEBRIEFED</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1a365d; margin-top: 0;">Hello ${recipientName}!</h2>
        <p style="font-size: 16px;">This is a friendly reminder about your upcoming consultation ${withText}:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #d4a84b; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #1a365d;">📋 ${caseTitle}</p>
          <p style="margin: 0 0 5px 0;">📅 <strong>Date:</strong> ${date}</p>
          <p style="margin: 0 0 5px 0;">🕐 <strong>Time:</strong> ${time}</p>
          <p style="margin: 0;">⏱️ <strong>Duration:</strong> ${duration} minutes</p>
        </div>
        
        ${meetingUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingUrl}" 
             style="background: #d4a84b; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            🎥 Join Video Call
          </a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 14px;">
          Save this link or add it to your calendar to join when it's time.
        </p>
        ` : ''}
        
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>💡 Tips for a successful consultation:</strong><br>
            • Test your camera and microphone beforehand<br>
            • Have any relevant documents ready<br>
            • Find a quiet, well-lit space<br>
            • Join 5 minutes early
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>The Debriefed Team
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
