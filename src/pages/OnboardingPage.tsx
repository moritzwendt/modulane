import { ArrowLeft, ArrowRight, Buildings, Check, Copy, Key } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { WorkspaceLoader } from "../components/ui/WorkspaceLoader"
import type { JoinCodeRole } from "../domain/types"
import { useAuth } from "../state/AuthContext"
import { joinCodeRoles, useWorkspace } from "../state/WorkspaceContext"
import { AuthLayout } from "./AuthPages"

type OnboardingMode = "choice" | "create" | "join"

export function OnboardingPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const { workspaceId, currentUserId, loading: workspaceLoading, createWorkspace, joinWorkspace, reload } = useWorkspace()
  const navigate = useNavigate()
  const [mode, setMode] = useState<OnboardingMode>("choice")
  const [organisationName, setOrganisationName] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [createdCode, setCreatedCode] = useState("")
  const [createdName, setCreatedName] = useState("")
  const [codeRole, setCodeRole] = useState<JoinCodeRole>("Mitglied")
  const [codeExpiresAt, setCodeExpiresAt] = useState("")
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (authLoading || workspaceLoading) return <WorkspaceLoader label="Konto wird vorbereitet" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (currentUserId !== user?.id) return <WorkspaceLoader label="Konto wird vorbereitet" />
  if (workspaceId && !createdCode) return <Navigate to="/dashboard" replace />

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (organisationName.trim().length < 2) return setError("Bitte gib der Organisation einen Namen.")
    setSubmitting(true)
    setError("")
    try {
      const result = await createWorkspace(organisationName.trim(), codeRole)
      setCreatedName(result.workspaceName)
      setCreatedCode(result.code)
      setCodeRole(result.role)
      setCodeExpiresAt(result.expiresAt)
      await reload()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Organisation konnte nicht erstellt werden.")
    } finally {
      setSubmitting(false)
    }
  }

  const join = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = accessCode.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (normalized.length !== 8) return setError("Der Zugangscode besteht aus acht Zeichen.")
    setSubmitting(true)
    setError("")
    try {
      await joinWorkspace(normalized)
      navigate("/dashboard")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Organisation konnte nicht gefunden werden.")
    } finally {
      setSubmitting(false)
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdCode.replace(/\s/g, ""))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (createdCode) {
    return <AuthLayout title="Organisation erstellt" description={`${createdName} ist bereit für dein Team.`}><div className="onboarding-success"><span className="onboarding-success-icon"><Check size={22} weight="bold" /></span><p>Teile diesen Zugangscode mit den Personen, die deiner Organisation beitreten sollen.</p><div className="access-code-result"><div className="access-code"><strong>{createdCode}</strong><button type="button" onClick={copyCode}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Kopiert" : "Kopieren"}</button></div><div className="access-code-meta"><span>Rolle: <strong>{codeRole}</strong></span><span>Gültig bis <strong>{new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(codeExpiresAt))} Uhr</strong></span></div></div><p className="field-helper">Der Code läuft nach einer Stunde automatisch ab. In den Organisationseinstellungen kannst du jederzeit einen neuen erzeugen.</p><button className="button primary auth-submit" type="button" onClick={() => navigate("/dashboard")}>Zum Dashboard<ArrowRight size={16} /></button></div></AuthLayout>
  }

  if (mode === "choice") {
    return <AuthLayout title="Wie möchtest du starten?" description="Erstelle eine neue Organisation oder tritt deinem Team bei."><div className="onboarding-options"><button type="button" onClick={() => setMode("create")}><span><Buildings size={21} /></span><div><strong>Organisation erstellen</strong><p>Richte einen neuen Bereich ein und lade dein Team per Zugangscode ein.</p></div><ArrowRight size={17} /></button><button type="button" onClick={() => setMode("join")}><span><Key size={21} /></span><div><strong>Organisation beitreten</strong><p>Nutze den achtstelligen Zugangscode, den du von deinem Team erhalten hast.</p></div><ArrowRight size={17} /></button></div></AuthLayout>
  }

  return <AuthLayout title={mode === "create" ? "Organisation erstellen" : "Organisation beitreten"} description={mode === "create" ? "Gib deiner gemeinsamen Organisation einen Namen." : "Gib den Zugangscode deines Teams ein."}><button className="onboarding-back" type="button" onClick={() => { setMode("choice"); setError("") }}><ArrowLeft size={15} />Auswahl ändern</button>{mode === "create" ? <form className="auth-form" onSubmit={create}><div className="field-group"><label htmlFor="organisation-name">Name der Organisation</label><input id="organisation-name" value={organisationName} onChange={(event) => setOrganisationName(event.target.value)} autoFocus /></div><div className="field-group"><label htmlFor="initial-code-role">Rolle des ersten Zugangscodes</label><select id="initial-code-role" value={codeRole} onChange={(event) => setCodeRole(event.target.value as JoinCodeRole)}>{joinCodeRoles.map((role) => <option key={role}>{role}</option>)}</select><p className="field-helper">Der Code ist eine Stunde gültig.</p></div>{error && <div className="form-alert" role="alert">{error}</div>}<button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Organisation wird erstellt" : "Organisation erstellen"}<ArrowRight size={16} /></button></form> : <form className="auth-form" onSubmit={join}><div className="field-group"><label htmlFor="access-code">Zugangscode</label><input id="access-code" className="access-code-input" value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} maxLength={9} autoComplete="one-time-code" placeholder="ABCD EFGH" autoFocus /><p className="field-helper">Leerzeichen spielen bei der Eingabe keine Rolle. Zugangscodes sind eine Stunde gültig.</p></div>{error && <div className="form-alert" role="alert">{error}</div>}<button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Code wird geprüft" : "Organisation beitreten"}<ArrowRight size={16} /></button></form>}</AuthLayout>
}
