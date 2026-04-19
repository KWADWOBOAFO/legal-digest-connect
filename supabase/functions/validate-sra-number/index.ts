import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent abuse as an open proxy
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sraNumber } = await req.json();

    if (!sraNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'SRA number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanNumber = sraNumber.toString().trim();

    // Basic input validation: SRA IDs are numeric, max ~10 digits
    if (!/^[0-9]{1,12}$/.test(cleanNumber)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid SRA number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try the API endpoint directly
    const apiResponse = await fetch(
      `https://sra-prod-apim.azure-api.net/sra/organisations/${encodeURIComponent(cleanNumber)}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          firmName: data?.name || data?.organisationName || null,
          status: data?.status || null,
          sraId: cleanNumber,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If direct lookup fails, try search endpoint
    const searchResponse = await fetch(
      `https://sra-prod-apim.azure-api.net/sra/search?searchText=${encodeURIComponent(cleanNumber)}&searchBy=Firm`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const results = searchData?.results || searchData || [];
      const match = Array.isArray(results)
        ? results.find((r: Record<string, unknown>) =>
            String(r.sraId || r.id || '').includes(cleanNumber)
          )
        : null;

      if (match) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: true,
            firmName: match.name || match.organisationName || null,
            status: match.status || null,
            sraId: cleanNumber,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        valid: false,
        message: 'SRA number could not be automatically verified. It will be manually reviewed by our team.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating SRA number:', error);
    return new Response(
      JSON.stringify({
        success: true,
        valid: false,
        message: 'Automatic verification unavailable. Your SRA number will be manually verified.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
