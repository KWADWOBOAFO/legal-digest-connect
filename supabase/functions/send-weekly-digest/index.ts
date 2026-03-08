import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Restricted CORS - this is a service-only endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generic error messages
const ErrorMessages = {
  UNAUTHORIZED: "Unauthorized access",
  INTERNAL_ERROR: "An error occurred processing your request",
};

interface UserDigest {
  userId: string;
  email: string;
  fullName: string;
  userType: 'individual' | 'firm';
  cases: {
    title: string;
    status: string;
    updatedAt: string;
  }[];
  consultations: {
    firmName: string;
    scheduledAt: string;
    status: string;
  }[];
  pendingActions: string[];
}

async function getUserDigests(supabase: any): Promise<UserDigest[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get all users with their profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, full_name, user_type');

  if (!profiles) return [];

  const digests: UserDigest[] = [];

  for (const profile of profiles) {
    const digest: UserDigest = {
      userId: profile.user_id,
      email: profile.email,
      fullName: profile.full_name || 'User',
      userType: profile.user_type,
      cases: [],
      consultations: [],
      pendingActions: []
    };

    if (profile.user_type === 'individual') {
      // Get cases for individual users
      const { data: cases } = await supabase
        .from('cases')
        .select('title, status, updated_at')
        .eq('user_id', profile.user_id)
        .gte('updated_at', oneWeekAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      if (cases) {
        digest.cases = cases.map((c: any) => ({
          title: c.title,
          status: c.status,
          updatedAt: c.updated_at
        }));
      }

      // Get consultations for individual users
      const { data: consultations } = await supabase
        .from('consultations')
        .select(`
          scheduled_at,
          status,
          law_firms (firm_name)
        `)
        .eq('user_id', profile.user_id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (consultations) {
        digest.consultations = consultations.map((c: any) => ({
          firmName: c.law_firms?.firm_name || 'Law Firm',
          scheduledAt: c.scheduled_at,
          status: c.status
        }));
      }

      // Check for pending actions
      const { data: pendingMatches } = await supabase
        .from('case_matches')
        .select('id')
        .eq('status', 'pending')
        .in('case_id', 
          (await supabase.from('cases').select('id').eq('user_id', profile.user_id)).data?.map((c: any) => c.id) || []
        );

      if (pendingMatches && pendingMatches.length > 0) {
        digest.pendingActions.push(`${pendingMatches.length} firm interest(s) awaiting your response`);
      }
    } else if (profile.user_type === 'firm') {
      // Get firm data
      const { data: firm } = await supabase
        .from('law_firms')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (firm) {
        // Get case matches for firm
        const { data: matches } = await supabase
          .from('case_matches')
          .select(`
            status,
            updated_at,
            cases (title)
          `)
          .eq('firm_id', firm.id)
          .gte('updated_at', oneWeekAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(10);

        if (matches) {
          digest.cases = matches.map((m: any) => ({
            title: m.cases?.title || 'Case',
            status: m.status,
            updatedAt: m.updated_at
          }));
        }

        // Get upcoming consultations for firm
        const { data: consultations } = await supabase
          .from('consultations')
          .select('scheduled_at, status')
          .eq('firm_id', firm.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5);

        if (consultations) {
          digest.consultations = consultations.map((c: any) => ({
            firmName: 'Client',
            scheduledAt: c.scheduled_at,
            status: c.status
          }));
        }

        // Check for pending reviews
        const { data: pendingReviews } = await supabase
          .from('case_matches')
          .select('id')
          .eq('firm_id', firm.id)
          .eq('status', 'pending');

        if (pendingReviews && pendingReviews.length > 0) {
          digest.pendingActions.push(`${pendingReviews.length} case(s) awaiting your review`);
        }
      }
    }

    // Only include users with activity
    if (digest.cases.length > 0 || digest.consultations.length > 0 || digest.pendingActions.length > 0) {
      digests.push(digest);
    }
  }

  return digests;
}

function generateDigestEmail(digest: UserDigest): { subject: string; html: string } {
  const subject = `Your Weekly Legal Update - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      matched: '#3b82f6',
      accepted: '#22c55e',
      scheduled: '#8b5cf6',
      completed: '#22c55e',
      rejected: '#ef4444'
    };
    const color = colors[status] || '#6b7280';
    return `<span style="background-color: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">${status}</span>`;
  };

  let casesHtml = '';
  if (digest.cases.length > 0) {
    casesHtml = `
      <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 12px;">📋 Case Activity This Week</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${digest.cases.map(c => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0;">
              <strong style="color: #1f2937;">${c.title}</strong><br>
              <span style="color: #6b7280; font-size: 12px;">Updated ${formatDate(c.updatedAt)}</span>
            </td>
            <td style="text-align: right; padding: 12px 0;">
              ${statusBadge(c.status)}
            </td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  let consultationsHtml = '';
  if (digest.consultations.length > 0) {
    consultationsHtml = `
      <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 12px;">📅 Upcoming Consultations</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${digest.consultations.map(c => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0;">
              <strong style="color: #1f2937;">${c.firmName}</strong><br>
              <span style="color: #6b7280; font-size: 12px;">${formatDate(c.scheduledAt)}</span>
            </td>
            <td style="text-align: right; padding: 12px 0;">
              ${statusBadge(c.status)}
            </td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  let actionsHtml = '';
  if (digest.pendingActions.length > 0) {
    actionsHtml = `
      <h2 style="color: #1f2937; font-size: 18px; margin: 24px 0 12px;">⚡ Action Required</h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${digest.pendingActions.map(action => `
          <li style="color: #1f2937; padding: 8px 0;">${action}</li>
        `).join('')}
      </ul>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 8px;">Hello, ${digest.fullName}!</h1>
          <p style="color: #6b7280; margin: 0 0 24px;">Here's your weekly summary of legal activity.</p>
          
          ${actionsHtml}
          ${casesHtml}
          ${consultationsHtml}
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="${Deno.env.get('SITE_URL') || 'https://legalmatch.app'}/dashboard" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          You're receiving this because you have an active account. 
          <a href="${Deno.env.get('SITE_URL') || 'https://legalmatch.app'}/settings" style="color: #6b7280;">Manage preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should ONLY be called by internal systems (cron jobs)
    // Verify internal API key
    const internalKey = req.headers.get("X-Internal-Key");
    const expectedInternalKey = Deno.env.get("INTERNAL_API_KEY");

    if (!expectedInternalKey || internalKey !== expectedInternalKey) {
      console.error("Invalid or missing internal API key");
      return new Response(
        JSON.stringify({ error: ErrorMessages.UNAUTHORIZED }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Internal API key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching user digests...");
    const digests = await getUserDigests(supabase);
    console.log(`Found ${digests.length} users with activity`);

    const results = [];

    for (const digest of digests) {
      try {
        const { subject, html } = generateDigestEmail(digest);
        
        const emailResponse = await resend.emails.send({
          from: "LegalMatch <digest@resend.dev>",
          to: [digest.email],
          subject,
          html,
        });

        console.log(`Email sent to ${digest.email}:`, emailResponse);
        results.push({ email: digest.email, success: true });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${digest.email}:`, emailError);
        results.push({ email: digest.email, success: false, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${digests.length} digests`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-digest function:", error);
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
