import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405)

  const url = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const authorization = request.headers.get("Authorization")
  if (!url || !anonKey || !serviceKey || !authorization) {
    return respond({ error: "The account service is not configured." }, 500)
  }

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: callerResult, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerResult.user) return respond({ error: "Sign in as an administrator first." }, 401)

  const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerResult.user.id)
    .single()
  if (profileError || callerProfile.role !== "admin") return respond({ error: "Only administrators can create student accounts." }, 403)

  let body: { full_name?: string; email?: string; password?: string; department_id?: string; academic_level?: string }
  try {
    body = await request.json()
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400)
  }

  const fullName = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const departmentId = body.department_id
  const academicLevel = body.academic_level
  if (!fullName || !email || !password || !departmentId || !["100", "200"].includes(academicLevel || "") || password.length < 8) {
    return respond({ error: "Enter the student name, email, department, level, and a password of at least 8 characters." }, 400)
  }

  const { data: department, error: departmentError } = await adminClient
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .maybeSingle()
  if (departmentError || !department) return respond({ error: "Choose a valid department." }, 400)

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, department_id: departmentId, academic_level: academicLevel },
  })
  if (createError) return respond({ error: createError.message }, 400)

  return respond({ student: { id: created.user.id, email, full_name: fullName, department_id: departmentId, academic_level: academicLevel } }, 201)
})

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
