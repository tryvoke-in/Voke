import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OnlineCompiler.io exact compiler identifiers
const LANG_MAP: Record<string, string> = {
  java:   'openjdk-25',
  c:      'gcc-15',
  cpp:    'g++-15',
  python: 'python-3.14',
  go:     'go-1.24',
  rust:   'rust-1.87',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { language, code, stdin } = await req.json();

    const compiler = LANG_MAP[language];
    if (!compiler) {
      return new Response(JSON.stringify({ error: `Language '${language}' not supported.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get('ONLINE_COMPILER_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OnlineCompiler API key not configured on server.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const payload = {
      compiler,
      code,
      input: stdin || '',
    };

    const response = await fetch('https://api.onlinecompiler.io/api/run-code-sync/', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Response: { output, error, status, exit_code, time, memory }
    return new Response(JSON.stringify({
      run: {
        output: data.output ?? '',
        stderr: data.error ?? '',
        code:   data.exit_code ?? 0,
      },
      time:   data.time,
      memory: data.memory,
      status: data.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  500,
    });
  }
});
