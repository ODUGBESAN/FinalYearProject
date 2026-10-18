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
    return respond({ error: "The department service is not configured." }, 500)
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
    return respond({ error: "Only administrators can delete departments." }, 403)
  }

  let body: { department_id?: string }
  try {
    body = await request.json()
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400)
  }

  const departmentId = body.department_id?.trim()
  if (!departmentId) return respond({ error: "Choose a department to delete." }, 400)

  const { data: department, error: departmentError } = await adminClient
    .from("departments")
    .select("id, name")
    .eq("id", departmentId)
    .maybeSingle()
  if (departmentError || !department) return respond({ error: "Department not found." }, 404)

  const [studentResult, lessonResult] = await Promise.all([
    adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("department_id", departmentId).eq("role", "student"),
    adminClient.from("lessons").select("id", { count: "exact", head: true }).eq("department_id", departmentId),
  ])
  if (studentResult.error || lessonResult.error) {
    return respond({ error: studentResult.error?.message || lessonResult.error?.message || "Could not check department usage." }, 500)
  }
  if ((studentResult.count || 0) > 0 || (lessonResult.count || 0) > 0) {
    return respond({
      error: `This department still has ${studentResult.count || 0} student(s) and ${lessonResult.count || 0} lesson(s). Reassign or remove them first.`,
    }, 409)
  }

  const { error: deleteError } = await adminClient.from("departments").delete().eq("id", departmentId)
  if (deleteError) return respond({ error: deleteError.message }, 400)
  return respond({ deleted_department: department })
})

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
