import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseTitle, caseDescription, practiceArea, rawNotes, clientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional legal consultation notes formatter for DEBRIEFED. Your task is to transform raw consultation notes into well-structured, professional legal consultation notes.

The notes should be clear, comprehensive, and suitable for:
1. Sending to the client as a record of the consultation
2. Internal file reference for the law firm
3. Follow-up actions and next steps

Format the output as a professional legal document with the following sections:
- Consultation Summary
- Key Points Discussed
- Legal Issues Identified
- Advice Provided
- Recommended Actions
- Next Steps
- Important Deadlines (if any)
- Client Questions and Responses

Keep the language professional but accessible to the client.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Client: ${clientName}
Case Title: ${caseTitle}
Practice Area: ${practiceArea}
Case Description: ${caseDescription}

Raw Consultation Notes:
${rawNotes}

Please format these notes into a professional consultation record.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate notes");
    }

    const data = await response.json();
    const formattedNotes = data.choices[0].message.content;

    return new Response(JSON.stringify({ formattedNotes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-consultation-notes function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
