import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.56.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const respond = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
})

const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "")
const joinCodeRoles = ["Administrator", "Mitglied", "Gast"] as const
type JoinCodeRole = typeof joinCodeRoles[number]

const readJoinCodeRole = (value: unknown): JoinCodeRole | null => joinCodeRoles.includes(value as JoinCodeRole) ? value as JoinCodeRole : null

const generateCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("")
}

const hashCode = async (code: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code))
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const authorization = request.headers.get("Authorization")
  if (!authorization) return respond({ error: "Nicht autorisiert" }, 401)

  const url = Deno.env.get("SUPABASE_URL")!
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const adminClient = createClient(url, serviceKey)
  const { data: authData, error: authError } = await userClient.auth.getUser()
  if (authError || !authData.user) return respond({ error: "Nicht autorisiert" }, 401)

  try {
    const body = await request.json()
    const action = String(body.action ?? "")
    const userId = authData.user.id

    if (action === "create") {
      const name = String(body.name ?? "").trim()
      if (name.length < 2) return respond({ error: "Bitte gib der Organisation einen Namen." }, 400)
      const role = readJoinCodeRole(body.role)
      if (!role) return respond({ error: "Bitte wähle eine gültige Rolle für den Zugangscode." }, 400)

      const { count } = await adminClient.from("workspace_members").select("workspace_id", { count: "exact", head: true }).eq("user_id", userId)
      if ((count ?? 0) > 0) return respond({ error: "Dein Konto gehört bereits zu einer Organisation." }, 409)

      const code = generateCode()
      const codeHash = await hashCode(code)
      const slugBase = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "organisation"
      const workspaceId = crypto.randomUUID()
      const { error: workspaceError } = await adminClient.from("workspaces").insert({
        id: workspaceId,
        name,
        slug: `${slugBase}_${userId.slice(0, 6)}`,
      })
      if (workspaceError) throw workspaceError

      const { error: memberError } = await adminClient.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: "Eigentümer",
      })
      if (memberError) {
        await adminClient.from("workspaces").delete().eq("id", workspaceId)
        throw memberError
      }

      const { data: joinCode, error: codeError } = await adminClient.from("workspace_join_codes").insert({
        workspace_id: workspaceId,
        code_hash: codeHash,
        created_by: userId,
        role,
      }).select("expires_at").single()
      if (codeError) {
        await adminClient.from("workspaces").delete().eq("id", workspaceId)
        throw codeError
      }

      return respond({ workspaceId, workspaceName: name, code: `${code.slice(0, 4)} ${code.slice(4)}`, role, expiresAt: joinCode.expires_at })
    }

    if (action === "join") {
      const { count } = await adminClient.from("workspace_members").select("workspace_id", { count: "exact", head: true }).eq("user_id", userId)
      if ((count ?? 0) > 0) return respond({ error: "Dein Konto gehört bereits zu einer Organisation." }, 409)

      const code = normalizeCode(String(body.code ?? ""))
      if (code.length !== 8) return respond({ error: "Der Zugangscode besteht aus acht Zeichen." }, 400)
      const codeHash = await hashCode(code)
      const { data: joinCode } = await adminClient.from("workspace_join_codes").select("workspace_id, role, expires_at").eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).maybeSingle()
      if (!joinCode) return respond({ error: "Dieser Zugangscode ist ungültig oder abgelaufen." }, 404)

      const { data: workspace } = await adminClient.from("workspaces").select("name").eq("id", joinCode.workspace_id).single()
      const { error: memberError } = await adminClient.from("workspace_members").insert({
        workspace_id: joinCode.workspace_id,
        user_id: userId,
        role: joinCode.role,
      })
      if (memberError && memberError.code !== "23505") throw memberError

      return respond({ workspaceId: joinCode.workspace_id, workspaceName: workspace?.name ?? "Organisation" })
    }

    if (action === "rotate") {
      const workspaceId = String(body.workspaceId ?? "")
      const role = readJoinCodeRole(body.role)
      if (!role) return respond({ error: "Bitte wähle eine gültige Rolle für den Zugangscode." }, 400)
      const { data: membership } = await adminClient.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle()
      if (!membership || !["Eigentümer", "Administrator"].includes(membership.role)) return respond({ error: "Du darfst den Zugangscode nicht ändern." }, 403)

      const code = generateCode()
      const codeHash = await hashCode(code)
      const { data: joinCode, error: codeError } = await adminClient.from("workspace_join_codes").upsert({
        workspace_id: workspaceId,
        code_hash: codeHash,
        created_by: userId,
        created_at: new Date().toISOString(),
        role,
      }, { onConflict: "workspace_id" }).select("expires_at").single()
      if (codeError) throw codeError

      return respond({ code: `${code.slice(0, 4)} ${code.slice(4)}`, role, expiresAt: joinCode.expires_at })
    }

    return respond({ error: "Unbekannte Aktion" }, 400)
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Die Anfrage konnte nicht abgeschlossen werden."
    return respond({ error: message }, 400)
  }
})
