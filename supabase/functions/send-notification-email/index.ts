import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generic error messages
const ErrorMessages = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  INTERNAL_ERROR: "An error occurred processing your request",
};

interface NotificationEmailRequest {
  type: "firm_interest" | "consultation_scheduled" | "consultation_reminder" | "firm_verified" | "firm_rejected";
  recipientEmail: string;
  recipientName: string;
  data: {
    firmName?: string;
    caseTitle?: string;
    consultationDate?: string;
    consultationTime?: string;
    meetingUrl?: string;
    rejectionReason?: string;
  };
}

const getEmailContent = (type: string, recipientName: string, data: NotificationEmailRequest["data"]) => {
  switch (type) {
    case "firm_interest":
      return {
        subject: `🔔 ${data.firmName} is interested in your case`,
        html: `
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
              <p style="font-size: 16px;">Great news! <strong>${data.firmName}</strong> has expressed interest in your case:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #d4a84b; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a365d;">${data.caseTitle}</p>
              </div>
              <p>Log in to your dashboard to review their profile and decide whether to accept their interest.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://id-preview--4096479d-6eed-4e22-8b7a-257836d49b76.lovable.app/dashboard" 
                   style="background: #d4a84b; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  View Dashboard
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Debriefed Team</p>
            </div>
          </body>
          </html>
        `,
      };

    case "consultation_scheduled":
      return {
        subject: `📅 Consultation scheduled with ${data.firmName}`,
        html: `
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
              <p style="font-size: 16px;">Your consultation has been scheduled:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Firm:</strong> ${data.firmName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Case:</strong> ${data.caseTitle}</p>
                <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${data.consultationDate}</p>
                <p style="margin: 0;"><strong>Time:</strong> ${data.consultationTime}</p>
              </div>
              ${data.meetingUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingUrl}" 
                   style="background: #d4a84b; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Join Meeting
                </a>
              </div>
              ` : ''}
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Debriefed Team</p>
            </div>
          </body>
          </html>
        `,
      };

    case "firm_verified":
      return {
        subject: `✅ Congratulations! Your law firm has been verified`,
        html: `
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
              <h2 style="color: #1a365d; margin-top: 0;">Congratulations, ${recipientName}!</h2>
              <div style="background: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">✓ ${data.firmName} has been verified!</p>
              </div>
              <p style="font-size: 16px;">Your law firm has been successfully verified by our team. You can now:</p>
              <ul style="font-size: 16px; color: #4b5563;">
                <li>View and express interest in client cases</li>
                <li>Schedule consultations with potential clients</li>
                <li>Build your reputation on the platform</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://id-preview--4096479d-6eed-4e22-8b7a-257836d49b76.lovable.app/dashboard" 
                   style="background: #d4a84b; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Debriefed Team</p>
            </div>
          </body>
          </html>
        `,
      };

    case "firm_rejected":
      return {
        subject: `⚠️ Your law firm verification requires attention`,
        html: `
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
              <h2 style="color: #1a365d; margin-top: 0;">Hello ${recipientName},</h2>
              <p style="font-size: 16px;">We've reviewed your verification request for <strong>${data.firmName}</strong>.</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Verification Not Approved</p>
                ${data.rejectionReason ? `<p style="margin: 0; color: #7f1d1d;">${data.rejectionReason}</p>` : '<p style="margin: 0; color: #7f1d1d;">Your application did not meet our verification criteria at this time.</p>'}
              </div>
              <p style="font-size: 16px;">If you believe this was in error or would like to provide additional information, please contact our support team.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://id-preview--4096479d-6eed-4e22-8b7a-257836d49b76.lovable.app/dashboard" 
                   style="background: #6b7280; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  View Dashboard
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Debriefed Team</p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Notification from Debriefed",
        html: `<p>You have a new notification. Please check your dashboard.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: ErrorMessages.UNAUTHORIZED }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's token to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: ErrorMessages.UNAUTHORIZED }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { type, recipientEmail, recipientName, data }: NotificationEmailRequest = await req.json();

    // Validate input
    if (!type || !recipientEmail || !recipientName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipientEmail, recipientName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authorization: Check if user is allowed to send this type of notification
    // For admin-only notifications (firm_verified, firm_rejected), verify admin role
    if (type === "firm_verified" || type === "firm_rejected") {
      // Check if user has admin role using the has_role function
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: roleCheck, error: roleError } = await serviceClient
        .rpc('has_role', { _user_id: userId, _role: 'admin' });

      if (roleError || !roleCheck) {
        console.error("User is not an admin:", userId);
        return new Response(
          JSON.stringify({ error: ErrorMessages.FORBIDDEN }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // For firm_interest notifications, verify the firm belongs to the user
    if (type === "firm_interest") {
      const { data: firmCheck, error: firmError } = await userClient
        .from('law_firms')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (firmError || !firmCheck) {
        console.error("User does not own a law firm:", userId);
        return new Response(
          JSON.stringify({ error: ErrorMessages.FORBIDDEN }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }
    
    console.log(`Sending ${type} email to ${recipientEmail}`);

    const { subject, html } = getEmailContent(type, recipientName, data);

    const emailResponse = await resend.emails.send({
      from: "Debriefed <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: ErrorMessages.INTERNAL_ERROR }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
