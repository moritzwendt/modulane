import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.56.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) return new Response(JSON.stringify({ error: "Nicht autorisiert" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const url = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
    const adminClient = createClient(url, serviceKey)
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) return new Response(JSON.stringify({ error: "Nicht autorisiert" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const body = await request.json()
    const workspaceId = String(body.workspaceId ?? "")
    const email = String(body.email ?? "").trim().toLocaleLowerCase()
    const firstName = String(body.firstName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const name = `${firstName} ${lastName}`.trim()
    const jobTitle = String(body.jobTitle ?? "").trim()
    const role = ["Administrator", "Mitglied", "Gast"].includes(body.role) ? body.role : "Mitglied"

    if (!workspaceId || !email.includes("@") || !firstName || !lastName) return new Response(JSON.stringify({ error: "Vorname, Nachname, E Mail Adresse und Organisation sind erforderlich." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: membership } = await adminClient.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", authData.user.id).maybeSingle()
    const { data: workspace } = await adminClient.from("workspaces").select("allow_member_invites").eq("id", workspaceId).single()
    const canInvite = membership?.role === "Eigentümer" || membership?.role === "Administrator" || (membership?.role === "Mitglied" && workspace?.allow_member_invites)
    if (!canInvite) return new Response(JSON.stringify({ error: "Du darfst für diese Organisation keine Personen einladen." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { error: invitationError } = await adminClient.from("workspace_invitations").upsert({
      workspace_id: workspaceId,
      email,
      name,
      role,
      job_title: jobTitle,
      invited_by: authData.user.id,
      status: "Ausstehend",
      accepted_at: null,
    }, { onConflict: "workspace_id,email" })
    if (invitationError) throw invitationError

    const { data: existingProfile } = await adminClient.from("profiles").select("id").eq("email", email).maybeSingle()
    if (existingProfile) {
      const { error: memberError } = await adminClient.from("workspace_members").upsert({ workspace_id: workspaceId, user_id: existingProfile.id, role })
      if (memberError) throw memberError
      await adminClient.from("profiles").update({ name, first_name: firstName, last_name: lastName, initials: `${firstName[0]}${lastName[0]}`.toLocaleUpperCase(), job_title: jobTitle }).eq("id", existingProfile.id)
      await adminClient.from("workspace_invitations").update({ status: "Angenommen", accepted_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("email", email)
      return new Response(JSON.stringify({ status: "added" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const redirectTo = request.headers.get("origin") ? `${request.headers.get("origin")}/login` : undefined
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: name,
        first_name: firstName,
        last_name: lastName,
        job_title: jobTitle,
        invited_workspace_id: workspaceId,
        workspace_role: role,
      },
    })
    if (inviteError) throw inviteError

    return new Response(JSON.stringify({ status: "invited" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Einladung konnte nicht gesendet werden."
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
