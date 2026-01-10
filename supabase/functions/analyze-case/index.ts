import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRACTICE_AREAS = [
  "Criminal Law",
  "Contract Law",
  "Family Law",
  "Property Law",
  "Tax Law",
  "Cyber Crime Law",
  "Tort Law",
  "Intellectual Property Law",
  "Immigration Law",
  "Employment Law",
  "Commercial Law",
  "Company Law",
  "Maritime Law",
  "Wills, Trust and Probate Law",
  "Environmental Law",
  "Sports Law",
  "Media and Entertainment Law",
  "Banking and Finance Law",
  "Technology and AI Law",
  "Construction Law",
  "Personal Injury Law",
  "Clinical Negligence",
  "Human Rights Law",
  "Constitutional and Administrative Law",
  "ADR Law"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, facts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a legal case analyzer for DEBRIEFED, a platform that connects individuals with legal professionals. Your task is to analyze legal matters and identify the most relevant practice areas.

Available practice areas: ${PRACTICE_AREAS.join(", ")}

Analyze the case and provide:
1. A structured summary of the legal issues
2. The primary practice area (most relevant)
3. Secondary practice areas that may apply
4. Key legal elements identified in the facts
5. Questions the client should be prepared to discuss with a lawyer

Format your response as JSON with the following structure:
{
  "summary": "Brief structured summary of the legal matter",
  "primaryPracticeArea": "Main practice area",
  "secondaryPracticeAreas": ["Array of other relevant areas"],
  "legalElements": ["Key legal elements identified"],
  "preparationQuestions": ["Questions for the client to consider"],
  "urgencyAssessment": "low|medium|high",
  "complexityLevel": "simple|moderate|complex"
}`;

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
            content: `Title: ${title}\n\nDescription: ${description}\n\nFacts: ${facts || "No additional facts provided"}` 
          }
        ],
        response_format: { type: "json_object" }
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
      throw new Error("Failed to analyze case");
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        summary: analysisText,
        primaryPracticeArea: "General Legal Inquiry",
        secondaryPracticeAreas: [],
        legalElements: [],
        preparationQuestions: [],
        urgencyAssessment: "medium",
        complexityLevel: "moderate"
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-case function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
