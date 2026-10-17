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
  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerResult.user.id)
    .single()
  if (callerProfileError || callerProfile.role !== "admin") {
    return respond({ error: "Only administrators can edit student accounts." }, 403)
  }

  let body: {
    student_id?: string
    full_name?: string
    email?: string
    password?: string
    department_id?: string | null
    academic_level?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400)
  }

  const studentId = body.student_id?.trim()
  const fullName = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const departmentId = body.department_id || null
  const academicLevel = body.academic_level || null
  const password = body.password

  if (!studentId || !fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ error: "Enter a valid student name and email." }, 400)
  }
  if (password !== undefined && (typeof password !== "string" || password.length < 8)) {
    return respond({ error: "A new password must contain at least 8 characters." }, 400)
  }
  if (academicLevel !== null && !["100", "200"].includes(academicLevel)) {
    return respond({ error: "Choose 100 Level, 200 Level, or leave the level unassigned." }, 400)
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("profiles")
    .select("id, role, full_name, email, department_id, academic_level")
    .eq("id", studentId)
    .maybeSingle()
  if (targetProfileError || !targetProfile || targetProfile.role !== "student") {
    return respond({ error: "Student account not found." }, 404)
  }

  if (departmentId) {
    const { data: department, error: departmentError } = await adminClient
      .from("departments")
      .select("id")
      .eq("id", departmentId)
      .maybeSingle()
    if (departmentError || !department) return respond({ error: "Choose a valid department." }, 400)
  }

  const { data: targetAuth, error: targetAuthError } = await adminClient.auth.admin.getUserById(studentId)
  if (targetAuthError || !targetAuth.user) return respond({ error: "Student sign-in account not found." }, 404)

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName, email, department_id: departmentId, academic_level: academicLevel })
    .eq("id", studentId)
    .eq("role", "student")

  if (profileUpdateError) return respond({ error: profileUpdateError.message }, 400)

  const authAttributes: {
    email: string
    email_confirm: boolean
    password?: string
    user_metadata: Record<string, unknown>
  } = {
    email,
    email_confirm: true,
    user_metadata: {
      ...(targetAuth.user.user_metadata || {}),
      full_name: fullName,
      department_id: departmentId,
      academic_level: academicLevel,
    },
  }
  if (password !== undefined) authAttributes.password = password

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(studentId, authAttributes)
  if (authUpdateError) {
    const { error: rollbackError } = await adminClient
      .from("profiles")
      .update({
        full_name: targetProfile.full_name,
        email: targetProfile.email,
        department_id: targetProfile.department_id,
        academic_level: targetProfile.academic_level,
      })
      .eq("id", studentId)

    if (rollbackError) {
      return respond({ error: `Account update failed: ${authUpdateError.message}. Profile rollback also failed: ${rollbackError.message}` }, 500)
    }
    return respond({ error: authUpdateError.message }, 400)
  }

  return respond({
    student: {
      id: studentId,
      full_name: fullName,
      email,
      department_id: departmentId,
      academic_level: academicLevel,
      password_updated: password !== undefined,
    },
  })
})

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
