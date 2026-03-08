import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyFirmsRequest {
  caseId: string;
  caseTitle: string;
  practiceArea: string;
  userLatitude?: number;
  userLongitude?: number;
  userCity?: string;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-matching-firms function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's token to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !authUser) {
      console.error("Auth verification failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authUser.id;
    console.log("Authenticated user:", userId);

    const { caseId, caseTitle, practiceArea, userLatitude, userLongitude, userCity }: NotifyFirmsRequest = await req.json();

    // Validate input
    if (!caseId || !caseTitle) {
      return new Response(
        JSON.stringify({ error: "Case ID and title are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user owns this case
    const { data: caseData, error: caseError } = await userClient
      .from('cases')
      .select('id, user_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error("Case not found:", caseError);
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (caseData.user_id !== userId) {
      console.error("User does not own this case");
      return new Response(
        JSON.stringify({ error: "Unauthorized access to case" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for privileged operations (sending emails to firms)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Finding matching firms for case: ${caseTitle}, practice area: ${practiceArea}`);

    // Find verified firms with matching practice areas
    let query = supabase
      .from('law_firms')
      .select('id, firm_name, user_id, latitude, longitude, city, practice_areas')
      .eq('is_verified', true)
      .eq('nda_signed', true);

    if (practiceArea) {
      query = query.contains('practice_areas', [practiceArea]);
    }

    const { data: firms, error: firmsError } = await query;

    if (firmsError) {
      console.error("Error fetching firms:", firmsError);
      throw firmsError;
    }

    console.log(`Found ${firms?.length || 0} matching firms`);

    // Filter firms by distance if user location is available (100km radius)
    let matchingFirms = firms || [];
    if (userLatitude && userLongitude) {
      matchingFirms = matchingFirms.filter(firm => {
        if (!firm.latitude || !firm.longitude) return true; // Include firms without location
        const distance = calculateDistance(userLatitude, userLongitude, firm.latitude, firm.longitude);
        return distance <= 100; // 100km radius
      });
    }

    console.log(`${matchingFirms.length} firms within radius`);

    // Get firm user emails from profiles
    const firmUserIds = matchingFirms.map(f => f.user_id);
    
    if (firmUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .in('user_id', firmUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Send emails to matching firms
    const emailPromises = matchingFirms.map(async (firm) => {
      const profile = profiles?.find(p => p.user_id === firm.user_id);
      if (!profile?.email) {
        console.log(`No email found for firm: ${firm.firm_name}`);
        return null;
      }

      const locationInfo = userCity ? ` in ${userCity}` : '';

      try {
        const emailResponse = await resend.emails.send({
          from: "Debriefed <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🔔 New matching case: ${caseTitle}`,
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
                <h2 style="color: #1a365d; margin-top: 0;">Hello ${profile.full_name || firm.firm_name}!</h2>
                <p style="font-size: 16px;">A new case matching your practice areas has been submitted${locationInfo}:</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #d4a84b; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #1a365d;">${caseTitle}</p>
                  <p style="margin: 0; color: #6b7280;">Practice Area: <strong>${practiceArea || 'General'}</strong></p>
                </div>
                <p>Log in to your dashboard to review this case and express your interest.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://id-preview--4096479d-6eed-4e22-8b7a-257836d49b76.lovable.app/dashboard" 
                     style="background: #d4a84b; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    View Case
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Debriefed Team</p>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${profile.email} for firm ${firm.firm_name}`);
        return emailResponse;
      } catch (emailError) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    const successfulEmails = results.filter(r => r !== null).length;

    console.log(`Successfully sent ${successfulEmails} notification emails`);

    return new Response(JSON.stringify({ success: true, notified: successfulEmails }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-matching-firms:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
