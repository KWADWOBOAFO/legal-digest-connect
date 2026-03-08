import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    
    // Verify caller's token
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser()
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
    
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, user_id, role } = await req.json()

    if (action === 'list') {
      // List all users with their roles
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('user_id, email, full_name, user_type')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabaseClient
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) throw rolesError

      const usersWithRoles = (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
      }))

      return new Response(JSON.stringify({ users: usersWithRoles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'add_role') {
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'user_id and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Prevent admins from removing their own admin role
      if (user_id === caller.id && role === 'admin') {
        return new Response(JSON.stringify({ error: 'Cannot modify your own admin role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabaseClient
        .from('user_roles')
        .upsert({ user_id, role }, { onConflict: 'user_id,role' })

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'remove_role') {
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'user_id and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (user_id === caller.id && role === 'admin') {
        return new Response(JSON.stringify({ error: 'Cannot remove your own admin role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role', role)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
