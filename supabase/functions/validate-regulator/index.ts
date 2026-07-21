import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Regulator = 'sra' | 'bsb' | 'cilex' | 'lsra' | 'iaa' | 'other';

interface RegulatorConfig {
  label: string;
  registerUrl: (num: string) => string;
  numberPattern: RegExp;
}

const REGISTERS: Record<Regulator, RegulatorConfig> = {
  sra: {
    label: 'SRA — Solicitors Regulation Authority',
    registerUrl: (n) => `https://solicitors.lawsociety.org.uk/search/results?Type=Person&SraNumber=${encodeURIComponent(n)}`,
    numberPattern: /^[0-9]{1,12}$/,
  },
  bsb: {
    label: 'BSB — Bar Standards Board',
    registerUrl: (n) => `https://www.barstandardsboard.org.uk/for-the-public/search-a-barristers-record.html?bsb=${encodeURIComponent(n)}`,
    numberPattern: /^[A-Z0-9-]{4,20}$/i,
  },
  cilex: {
    label: 'CILEx Regulation',
    registerUrl: (n) => `https://cilexregulation.org.uk/regulated-persons-search/?membership=${encodeURIComponent(n)}`,
    numberPattern: /^[A-Z0-9-]{4,20}$/i,
  },
  lsra: {
    label: 'LSRA — Legal Services Regulatory Authority (Ireland)',
    registerUrl: (n) => `https://www.lsra.ie/for-the-public/search-the-roll-of-solicitors/?q=${encodeURIComponent(n)}`,
    numberPattern: /^[A-Z0-9-]{2,20}$/i,
  },
  iaa: {
    label: 'IAA — Immigration Advice Authority',
    registerUrl: (n) => `https://www.gov.uk/find-an-immigration-adviser?number=${encodeURIComponent(n)}`,
    numberPattern: /^[A-Z0-9-]{3,30}$/i,
  },
  other: {
    label: 'Other regulator',
    registerUrl: () => '',
    numberPattern: /^.{2,40}$/,
  },
};

async function verifySRA(cleanNumber: string) {
  try {
    const apiResponse = await fetch(
      `https://sra-prod-apim.azure-api.net/sra/organisations/${encodeURIComponent(cleanNumber)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return {
        valid: true,
        auto: true,
        firmName: data?.name || data?.organisationName || null,
        status: data?.status || null,
      };
    }
    const searchResponse = await fetch(
      `https://sra-prod-apim.azure-api.net/sra/search?searchText=${encodeURIComponent(cleanNumber)}&searchBy=Firm`,
      { headers: { Accept: 'application/json' } },
    );
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const results = searchData?.results || searchData || [];
      const match = Array.isArray(results)
        ? results.find((r: Record<string, unknown>) => String(r.sraId || r.id || '').includes(cleanNumber))
        : null;
      if (match) {
        return {
          valid: true,
          auto: true,
          firmName: (match as any).name || (match as any).organisationName || null,
          status: (match as any).status || null,
        };
      }
    }
  } catch (err) {
    console.error('SRA lookup error', err);
  }
  return { valid: false, auto: true, message: 'SRA number not found in the public register.' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { regulator, number } = await req.json();
    const reg = String(regulator || '').toLowerCase() as Regulator;
    if (!REGISTERS[reg]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown regulatory body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cfg = REGISTERS[reg];
    const clean = String(number || '').trim();

    if (!cfg.numberPattern.test(clean)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid registration number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // SRA: attempt real-time lookup against the SRA public API.
    if (reg === 'sra') {
      const result = await verifySRA(clean);
      return new Response(
        JSON.stringify({
          success: true,
          regulator: reg,
          registerUrl: cfg.registerUrl(clean),
          checkedAt: new Date().toISOString(),
          ...result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Other regulators don't expose an open JSON API — return a deep link
    // to the official published register so the firm (and admin) can
    // verify the entry in one click. Store the URL alongside the firm
    // record for the admin to audit before flipping is_verified.
    return new Response(
      JSON.stringify({
        success: true,
        regulator: reg,
        valid: null,
        auto: false,
        registerUrl: cfg.registerUrl(clean),
        checkedAt: new Date().toISOString(),
        message: `Real-time lookup isn't available for ${cfg.label}. Use the register link to confirm this entry.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('validate-regulator error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Automatic verification unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
