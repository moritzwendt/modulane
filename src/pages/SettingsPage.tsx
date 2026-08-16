import { Bell, Buildings, Check, Copy, Key, UploadSimple, UserCircle } from "@phosphor-icons/react"
import { useState, type FormEvent, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { IdentityImage } from "../components/ui/IdentityImage"
import type { ProjectStatus, WorkspaceVisibility } from "../domain/types"
import { useAuth } from "../state/AuthContext"
import { projectStatuses, useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"

type SettingsTab = "Workspace" | "Konto" | "Benachrichtigungen"

export function SettingsPage() {
  const { settings, users, currentUserId, updateWorkspaceSettings, updateUser, uploadUserAvatar, uploadOrganizationLogo, rotateWorkspaceCode } = useWorkspace()
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const requestedTab = searchParams.get("tab")
  const tab: SettingsTab = requestedTab === "account" ? "Konto" : requestedTab === "notifications" ? "Benachrichtigungen" : "Workspace"
  const [workspaceInput, setWorkspaceInput] = useState(settings)
  const [accountInput, setAccountInput] = useState({ firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email, jobTitle: currentUser.jobTitle })
  const [accessCode, setAccessCode] = useState("")
  const [rotatingCode, setRotatingCode] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [notificationSaveState, setNotificationSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const saveWorkspace = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateWorkspaceSettings(workspaceInput)
      showToast("Organisationseinstellungen gespeichert")
    } catch {
      showToast("Organisationseinstellungen konnten nicht gespeichert werden", "info")
    }
  }

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (!accountInput.firstName.trim() || !accountInput.lastName.trim()) return showToast("Vorname und Nachname sind erforderlich", "info")
    try {
      await updateUser(currentUser.id, accountInput)
      showToast("Kontodaten gespeichert")
    } catch {
      showToast("Kontodaten konnten nicht gespeichert werden", "info")
    }
  }

  const uploadAvatar = async (file?: File) => {
    if (!file) return
    setUploadingAvatar(true)
    try {
      await uploadUserAvatar(file)
      showToast("Profilbild gespeichert")
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Profilbild konnte nicht gespeichert werden", "info")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const uploadLogo = async (file?: File) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const logoUrl = await uploadOrganizationLogo(file)
      setWorkspaceInput((current) => ({ ...current, logoUrl }))
      showToast("Organisationslogo gespeichert")
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Organisationslogo konnte nicht gespeichert werden", "info")
    } finally {
      setUploadingLogo(false)
    }
  }

  const signOut = async () => {
    await logout()
    navigate("/login")
  }

  const createAccessCode = async () => {
    setRotatingCode(true)
    try {
      const code = await rotateWorkspaceCode()
      setAccessCode(code)
      showToast("Neuer Zugangscode erstellt")
    } catch {
      showToast("Zugangscode konnte nicht erstellt werden", "info")
    } finally {
      setRotatingCode(false)
    }
  }

  const copyAccessCode = async () => {
    await navigator.clipboard.writeText(accessCode.replace(/\s/g, ""))
    setCodeCopied(true)
    window.setTimeout(() => setCodeCopied(false), 1800)
  }

  const saveNotificationPreference = async (key: "emailNotifications" | "weeklyDigest", value: boolean) => {
    const previousValue = workspaceInput[key]
    setWorkspaceInput((current) => ({ ...current, [key]: value }))
    setNotificationSaveState("saving")
    try {
      await updateWorkspaceSettings({ [key]: value })
      setNotificationSaveState("saved")
    } catch {
      setWorkspaceInput((current) => ({ ...current, [key]: previousValue }))
      setNotificationSaveState("error")
      showToast("Benachrichtigungseinstellung konnte nicht gespeichert werden", "info")
    }
  }

  const tabs = [
    { id: "Workspace" as const, label: "Organisation", icon: Buildings },
    { id: "Konto" as const, label: "Mein Konto", icon: UserCircle },
    { id: "Benachrichtigungen" as const, label: "Benachrichtigungen", icon: Bell },
  ]

  const selectTab = (nextTab: SettingsTab) => {
    setSearchParams({ tab: nextTab === "Konto" ? "account" : nextTab === "Benachrichtigungen" ? "notifications" : "workspace" }, { replace: true })
  }

  return (
    <div className="page settings-page">
      <div className="page-header"><div><h1>Einstellungen</h1><p>Verwalte deine Organisation, dein Konto und persönliche Hinweise.</p></div></div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Einstellungsbereiche">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "active" : ""} type="button" onClick={() => selectTab(id)}><Icon size={16} />{label}</button>)}
        </nav>
        <div className="settings-content">
          {tab === "Workspace" && (
            <form onSubmit={saveWorkspace}>
              <SettingsSection title="Organisationsprofil" description="Diese Angaben sehen alle Personen in deiner Organisation.">
                <div className="identity-upload-row"><span className="organization-image"><IdentityImage name={workspaceInput.name} imageUrl={workspaceInput.logoUrl} color="#5f5f68" /></span><div><strong>Organisationslogo</strong><small>PNG, JPG oder WebP. Das Bild wird quadratisch zugeschnitten.</small>{["Eigentümer", "Administrator"].includes(currentUser.role) && <label className="button secondary upload-control"><UploadSimple size={15} />{uploadingLogo ? "Logo wird verarbeitet" : "Logo auswählen"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo} onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label>}</div></div>
                <div className="form-grid"><div className="field-group"><label htmlFor="workspace-name">Name</label><input id="workspace-name" value={workspaceInput.name} onChange={(event) => setWorkspaceInput({ ...workspaceInput, name: event.target.value })} /></div><div className="field-group"><label htmlFor="workspace-slug">Kurzname</label><input id="workspace-slug" value={workspaceInput.slug} onChange={(event) => setWorkspaceInput({ ...workspaceInput, slug: event.target.value.toLocaleLowerCase().replace(/\s+/g, "_") })} /></div></div>
                <div className="field-group"><label htmlFor="workspace-visibility">Zugriff</label><select id="workspace-visibility" value={workspaceInput.visibility} onChange={(event) => setWorkspaceInput({ ...workspaceInput, visibility: event.target.value as WorkspaceVisibility })}><option>Nur auf Einladung</option><option>Offen für die Organisation</option></select></div>
              </SettingsSection>
              <SettingsSection title="Standardwerte" description="Neue Projekte starten mit diesen Einstellungen.">
                <div className="field-group"><label htmlFor="default-project-status">Standardstatus für Projekte</label><select id="default-project-status" value={workspaceInput.defaultProjectStatus} onChange={(event) => setWorkspaceInput({ ...workspaceInput, defaultProjectStatus: event.target.value as ProjectStatus })}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
                <ToggleRow checked={workspaceInput.allowMemberInvites} onChange={(checked) => setWorkspaceInput({ ...workspaceInput, allowMemberInvites: checked })} title="Einladungen durch Mitglieder" description="Mitglieder dürfen weitere Personen in die Organisation einladen." />
              </SettingsSection>
              {["Eigentümer", "Administrator"].includes(currentUser.role) && <SettingsSection title="Zugangscode" description="Mit diesem Code können neue Personen deiner Organisation beitreten.">
                {accessCode ? <div className="access-code"><strong>{accessCode}</strong><button type="button" onClick={copyAccessCode}>{codeCopied ? <Check size={17} /> : <Copy size={17} />}{codeCopied ? "Kopiert" : "Kopieren"}</button></div> : <div className="settings-code-empty"><Key size={19} /><span><strong>Code geschützt</strong><small>Aus Sicherheitsgründen wird der aktuelle Code nicht im Klartext gespeichert.</small></span></div>}
                <p className="field-helper">Ein neuer Code macht den bisherigen Zugangscode sofort ungültig.</p>
                <button className="button secondary" type="button" onClick={createAccessCode} disabled={rotatingCode}><Key size={16} />{rotatingCode ? "Code wird erstellt" : "Neuen Zugangscode erstellen"}</button>
              </SettingsSection>}
              <div className="settings-actions"><button className="button primary" type="submit">Änderungen speichern</button></div>
            </form>
          )}
          {tab === "Konto" && (
            <form onSubmit={saveAccount}>
              <SettingsSection title="Persönliches Profil" description="Deine Angaben werden an Appteilen und Updates angezeigt.">
                <div className="identity-upload-row"><Avatar user={currentUser} size="large" /><div><strong>Profilbild</strong><small>Ohne Bild wird automatisch ein PNG mit deinen Initialen erstellt.</small><label className="button secondary upload-control"><UploadSimple size={15} />{uploadingAvatar ? "Bild wird verarbeitet" : "Bild auswählen"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingAvatar} onChange={(event) => void uploadAvatar(event.target.files?.[0])} /></label></div></div>
                <div className="form-grid"><div className="field-group"><label htmlFor="account-first-name">Vorname</label><input id="account-first-name" value={accountInput.firstName} onChange={(event) => setAccountInput({ ...accountInput, firstName: event.target.value })} autoComplete="given-name" required /></div><div className="field-group"><label htmlFor="account-last-name">Nachname</label><input id="account-last-name" value={accountInput.lastName} onChange={(event) => setAccountInput({ ...accountInput, lastName: event.target.value })} autoComplete="family-name" required /></div></div>
                <div className="field-group"><label htmlFor="account-job">Rolle im Team</label><input id="account-job" value={accountInput.jobTitle} onChange={(event) => setAccountInput({ ...accountInput, jobTitle: event.target.value })} /></div>
                <div className="field-group"><label htmlFor="account-email">E Mail Adresse</label><input id="account-email" type="email" value={accountInput.email} onChange={(event) => setAccountInput({ ...accountInput, email: event.target.value })} /></div>
              </SettingsSection>
              <div className="settings-actions split"><button className="button danger" type="button" onClick={signOut}>Abmelden</button><button className="button primary" type="submit">Kontodaten speichern</button></div>
            </form>
          )}
          {tab === "Benachrichtigungen" && (
            <div className="notification-settings">
              <SettingsSection title="Persönliche Hinweise" description="Lege fest, wann Modulane dich über Veränderungen informiert.">
                <ToggleRow checked={workspaceInput.emailNotifications} disabled={notificationSaveState === "saving"} onChange={(checked) => void saveNotificationPreference("emailNotifications", checked)} title="E Mail Benachrichtigungen" description="Erhalte Hinweise zu Zuweisungen, Erwähnungen und blockierten Appteilen." />
                <ToggleRow checked={workspaceInput.weeklyDigest} disabled={notificationSaveState === "saving"} onChange={(checked) => void saveNotificationPreference("weeklyDigest", checked)} title="Wöchentliche Zusammenfassung" description="Erhalte einmal pro Woche einen Überblick über alle aktiven Projekte." />
                <div className={`autosave-status ${notificationSaveState}`} aria-live="polite">{notificationSaveState === "saving" ? "Wird gespeichert" : notificationSaveState === "error" ? "Speichern fehlgeschlagen" : "Änderungen werden automatisch gespeichert"}</div>
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="settings-section"><div className="settings-section-heading"><h2>{title}</h2><p>{description}</p></div><div className="settings-section-body">{children}</div></section>
}

function ToggleRow({ checked, disabled = false, onChange, title, description }: { checked: boolean; disabled?: boolean; onChange(checked: boolean): void; title: string; description: string }) {
  return <label className="toggle-row"><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-control" /></label>
}
