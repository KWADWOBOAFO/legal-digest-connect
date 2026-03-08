const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sraNumber } = await req.json();

    if (!sraNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'SRA number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanNumber = sraNumber.toString().trim();

    // Query SRA public API - search by SRA ID
    const response = await fetch(
      `https://www.sra.org.uk/consumers/register/search/?searchBy=Firm&searchText=${encodeURIComponent(cleanNumber)}&numberOfResults=10`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // Try the API endpoint directly
    const apiResponse = await fetch(
      `https://sra-prod-apim.azure-api.net/sra/organisations/${encodeURIComponent(cleanNumber)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
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
        headers: {
          'Accept': 'application/json',
        },
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

    // If no match found from API, return not found but don't block
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
