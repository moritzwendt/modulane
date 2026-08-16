import { ArrowLeft, Archive, Check, GitBranch, LockSimple, Users } from "@phosphor-icons/react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import type { Project, ProjectStatus, ProjectType, ProjectVisibility } from "../domain/types"
import { projectStatuses, useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"

const projectTypes: ProjectType[] = ["Mobile App", "Web App", "Desktop App", "Website", "Backend", "API", "Bibliothek", "Browser Erweiterung", "Internes Tool", "Anderes"]
const platforms = ["iOS", "Android", "Web", "macOS", "Windows", "Linux", "Server"]

export function ProjectSettingsPage() {
  const { projectId } = useParams()
  const { projects, users, updateProject } = useWorkspace()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const project = projects.find((item) => item.id === projectId)
  const [input, setInput] = useState<Project | null>(project ?? null)

  if (!project || !input) return <div className="page"><div className="empty-state"><strong>Projekt nicht gefunden</strong></div></div>

  const togglePlatform = (platform: string) => setInput({ ...input, platforms: input.platforms.includes(platform) ? input.platforms.filter((item) => item !== platform) : [...input.platforms, platform] })
  const toggleMember = (userId: string) => setInput({ ...input, memberIds: input.memberIds.includes(userId) ? input.memberIds.filter((id) => id !== userId) : [...input.memberIds, userId] })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateProject(project.id, input)
      showToast("Projekteinstellungen gespeichert")
    } catch {
      showToast("Projekteinstellungen konnten nicht gespeichert werden", "info")
    }
  }

  const archive = async () => {
    try {
      await updateProject(project.id, { status: "Abgeschlossen" })
      showToast("Projekt abgeschlossen")
      navigate(`/projects/${project.id}`)
    } catch {
      showToast("Projekt konnte nicht abgeschlossen werden", "info")
    }
  }

  return (
    <div className="page project-settings-page">
      <div className="breadcrumbs"><Link to={`/projects/${project.id}`}><ArrowLeft size={15} />{project.name}</Link><span>/</span><span>Einstellungen</span></div>
      <div className="page-header"><div><h1>Projekteinstellungen</h1><p>Verwalte Identität, Zugriff, Team und optionale Codeverbindungen.</p></div></div>
      <form className="project-settings-form" onSubmit={submit}>
        <SettingsBlock icon={<Archive size={17} />} title="Projekt" description="Grundlegende Angaben und aktueller Projektstatus.">
          <div className="form-grid"><div className="field-group"><label htmlFor="settings-project-name">Name</label><input id="settings-project-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} /></div><div className="field-group"><label htmlFor="settings-project-prefix">Feature Kürzel</label><input id="settings-project-prefix" value={input.featurePrefix} maxLength={5} onChange={(event) => setInput({ ...input, featurePrefix: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></div></div>
          <div className="field-group"><label htmlFor="settings-project-description">Beschreibung</label><textarea id="settings-project-description" value={input.description} rows={3} onChange={(event) => setInput({ ...input, description: event.target.value })} /></div>
          <div className="form-grid"><div className="field-group"><label htmlFor="settings-project-type">Typ</label><select id="settings-project-type" value={input.type} onChange={(event) => setInput({ ...input, type: event.target.value as ProjectType })}>{projectTypes.map((type) => <option key={type}>{type}</option>)}</select></div><div className="field-group"><label htmlFor="settings-project-status">Status</label><select id="settings-project-status" value={input.status} onChange={(event) => setInput({ ...input, status: event.target.value as ProjectStatus })}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select></div></div>
          <fieldset className="field-group"><legend>Plattformen</legend><div className="choice-grid">{platforms.map((platform) => <label key={platform} className="choice-row"><input type="checkbox" checked={input.platforms.includes(platform)} onChange={() => togglePlatform(platform)} /><span>{platform}</span></label>)}</div></fieldset>
        </SettingsBlock>
        <SettingsBlock icon={<LockSimple size={17} />} title="Zugriff" description="Lege fest, wer dieses Projekt finden und öffnen kann.">
          <div className="access-options"><label className={input.visibility === "Workspace" ? "selected" : ""}><input type="radio" name="visibility" checked={input.visibility === "Workspace"} onChange={() => setInput({ ...input, visibility: "Workspace" as ProjectVisibility })} /><span><strong>Workspace</strong><small>Alle Mitglieder können das Projekt sehen.</small></span><Check size={16} /></label><label className={input.visibility === "Privat" ? "selected" : ""}><input type="radio" name="visibility" checked={input.visibility === "Privat"} onChange={() => setInput({ ...input, visibility: "Privat" as ProjectVisibility })} /><span><strong>Privat</strong><small>Nur ausgewählte Mitglieder haben Zugriff.</small></span><Check size={16} /></label></div>
        </SettingsBlock>
        <SettingsBlock icon={<Users size={17} />} title="Projektteam" description="Diese Personen können Features sehen und App Teile übernehmen.">
          <div className="member-choices">{users.map((user) => <label key={user.id} className="member-choice"><Avatar user={user} size="small" /><span><strong>{user.name}</strong><small>{user.jobTitle}</small></span><input type="checkbox" checked={input.memberIds.includes(user.id)} onChange={() => toggleMember(user.id)} /></label>)}</div>
        </SettingsBlock>
        <SettingsBlock icon={<GitBranch size={17} />} title="Code Verbindung" description="Die Verbindung ist optional. Manuelle Commits funktionieren auch ohne Repository.">
          <div className="field-group"><label htmlFor="repository-name">Repository</label><input id="repository-name" value={input.repositoryName} onChange={(event) => setInput({ ...input, repositoryName: event.target.value })} placeholder="organisation/repository" /><p className="field-helper">Speichere den vollständigen Namen des Repositorys für manuelle Code Referenzen.</p></div>
        </SettingsBlock>
        <div className="settings-actions split"><button className="button danger" type="button" onClick={archive}>Projekt abschließen</button><button className="button primary" type="submit">Projekteinstellungen speichern</button></div>
      </form>
    </div>
  )
}

function SettingsBlock({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <section className="settings-section project-settings-block"><div className="settings-section-heading"><span className="settings-icon">{icon}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="settings-section-body">{children}</div></section>
}
