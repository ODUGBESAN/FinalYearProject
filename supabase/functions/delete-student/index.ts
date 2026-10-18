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
    return respond({ error: "Only administrators can delete student accounts." }, 403)
  }

  let body: { student_id?: string }
  try {
    body = await request.json()
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400)
  }

  const studentId = body.student_id?.trim()
  if (!studentId) return respond({ error: "Choose a student account to delete." }, 400)

  const { data: student, error: studentError } = await adminClient
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", studentId)
    .maybeSingle()
  if (studentError || !student || student.role !== "student") {
    return respond({ error: "Student account not found." }, 404)
  }

  const { count: lessonCount, error: lessonError } = await adminClient
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("created_by", studentId)
  if (lessonError) return respond({ error: lessonError.message }, 500)
  if (lessonCount) {
    return respond({ error: "This student account is linked to lessons. Reassign or remove those lessons before deleting the account." }, 409)
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(studentId)
  if (deleteError) return respond({ error: deleteError.message }, 400)

  return respond({ deleted_student: { id: student.id, full_name: student.full_name, email: student.email } })
})

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
