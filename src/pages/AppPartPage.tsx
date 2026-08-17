import { ArrowLeft, Check, Code, GitBranch, GitCommit, LinkSimple, Pause, PencilSimple, Play, Plus } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { Avatar, AvatarGroup } from "../components/ui/Avatar"
import { AppSelect } from "../components/ui/AppSelect"
import { Modal } from "../components/ui/Modal"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { AppPart, CommitInput, ReleaseState } from "../domain/types"
import { canContributeToProject } from "../domain/permissions"
import { releaseStates, useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"
import { relativeDate } from "../utils/format"

export function AppPartPage() {
  const { appPartId } = useParams()
  const { appParts, projects, features, users, currentUserId, updateAppPart, startAppPartWork, stopAppPartWork, addAppPartCommit } = useWorkspace()
  const { showToast } = useToast()
  const appPart = appParts.find((item) => item.id === appPartId)
  const project = projects.find((item) => item.id === appPart?.projectId)
  const [editOpen, setEditOpen] = useState(false)
  const [commit, setCommit] = useState<CommitInput>({ message: "", hash: "", branch: "main", authorId: currentUserId, url: "" })

  if (!appPart || !project) return <div className="page"><div className="empty-state"><strong>Komponente nicht gefunden</strong></div></div>

  const linkedFeatures = features.filter((feature) => feature.appPartIds.includes(appPart.id))
  const activeUsers = users.filter((user) => appPart.activeUserIds.includes(user.id))
  const currentUser = users.find((user) => user.id === currentUserId)
  const canEdit = Boolean(currentUser && canContributeToProject(currentUser.role, project, currentUserId) && currentUser.role !== "guest")
  const workingByMe = appPart.activeUserIds.includes(currentUserId)

  const submitCommit = (event: FormEvent) => {
    event.preventDefault()
    if (!commit.message.trim() || !commit.hash.trim()) return
    addAppPartCommit(appPart.id, { ...commit, message: commit.message.trim(), hash: commit.hash.trim(), branch: commit.branch.trim() || "main", url: commit.url.trim() })
    setCommit({ message: "", hash: "", branch: commit.branch, authorId: currentUserId, url: "" })
    showToast("Commit hinzugefügt")
  }

  const toggleWork = async () => {
    if (workingByMe) {
      await stopAppPartWork(appPart.id)
      showToast("Komponente freigegeben")
      return
    }
    await startAppPartWork(appPart.id)
    showToast("Arbeit an Komponente begonnen")
  }

  return <div className="app-part-page"><header className="app-part-header"><div className="breadcrumbs"><Link to="/components"><ArrowLeft size={15} />Komponenten</Link><span>/</span><span>{project.name}</span><span>/</span><span>{appPart.key}</span></div><div className="app-part-title-row"><div><span className="feature-key heading-key">{appPart.key}</span><h1>{appPart.name}</h1>{appPart.description && <p>{appPart.description}</p>}</div><div className="app-part-title-actions">{activeUsers.length > 0 && <AvatarGroup users={activeUsers} limit={5} />}{canEdit && <button className="button secondary" type="button" onClick={() => setEditOpen(true)}><PencilSimple size={16} />Bearbeiten</button>}{canEdit && <button className={workingByMe ? "button secondary occupied" : "button primary"} type="button" onClick={toggleWork}>{workingByMe ? <Pause size={16} /> : <Play size={16} />}{workingByMe ? "Freigeben" : activeUsers.length ? "Auch daran arbeiten" : "Daran arbeiten"}</button>}</div></div><div className="app-part-state-grid"><div><span>Technischer Zustand</span>{canEdit ? <AppSelect compact value={appPart.releaseState} onValueChange={(releaseState) => updateAppPart(appPart.id, { releaseState: releaseState as ReleaseState })} ariaLabel="Technischer Zustand" options={releaseStates.map((state) => ({ value: state, label: state }))} /> : <StatusBadge value={appPart.releaseState} />}</div><div><span>Bereich</span><strong>{appPart.platform}</strong></div><div><span>Gerade aktiv</span>{activeUsers.length ? <AvatarGroup users={activeUsers} /> : <strong>Nicht belegt</strong>}</div></div></header><div className="app-part-content"><main><section className="content-section"><div className="section-heading"><h2>Verknüpfte Aufgaben</h2><span>{linkedFeatures.length}</span></div><div className="linked-feature-list">{linkedFeatures.map((feature) => <Link key={feature.id} to={`/projects/${feature.projectId}/tasks/${feature.id}`}><span className="feature-key">{feature.key}</span><div><strong>{feature.title}</strong><span>{feature.description}</span></div><StatusBadge value={feature.status} /></Link>)}{!linkedFeatures.length && <div className="empty-state"><Check size={24} /><strong>Keine Aufgabe verknüpft</strong></div>}</div></section><section className="content-section code-section"><div className="section-heading"><h2>Code und Commits</h2><span>{appPart.commits.length} verknüpft</span></div><div className="code-connection-bar"><span className="code-placeholder-icon"><Code size={20} /></span><div><strong>{project.repositoryName || "Kein Repository verbunden"}</strong></div><Link className="button secondary" to={`/projects/${project.id}/settings`}><LinkSimple size={15} />Verbindung verwalten</Link></div>{canEdit && <form className="commit-composer" onSubmit={submitCommit}><div className="commit-composer-heading"><GitCommit size={18} /><strong>Commit hinzufügen</strong></div><div className="field-group"><label htmlFor="app-part-commit-message">Beschreibung</label><input id="app-part-commit-message" value={commit.message} onChange={(event) => setCommit({ ...commit, message: event.target.value })} placeholder="Was wurde verändert?" /></div><div className="form-grid"><div className="field-group"><label htmlFor="app-part-commit-hash">Commit Kennung</label><input id="app-part-commit-hash" value={commit.hash} onChange={(event) => setCommit({ ...commit, hash: event.target.value })} placeholder="7c31a9f" /></div><div className="field-group"><label htmlFor="app-part-commit-branch">Branch</label><input id="app-part-commit-branch" value={commit.branch} onChange={(event) => setCommit({ ...commit, branch: event.target.value })} /></div></div><div className="commit-composer-actions"><div className="field-group compact"><label htmlFor="app-part-commit-url">Link optional</label><input id="app-part-commit-url" type="url" value={commit.url} onChange={(event) => setCommit({ ...commit, url: event.target.value })} placeholder="https://github.com/..." /></div><button className="button primary" type="submit" disabled={!commit.message.trim() || !commit.hash.trim()}><Plus size={15} />Commit hinzufügen</button></div></form>}<div className="commit-list">{appPart.commits.map((item) => { const author = users.find((user) => user.id === item.authorId); const content = <><span className="commit-hash">{item.hash}</span><div><strong>{item.message}</strong><span><GitBranch size={13} />{item.branch}<span className="inline-separator">/</span>{author?.name}<span className="inline-separator">/</span>{relativeDate(item.createdAt)}</span></div>{item.url && <LinkSimple size={15} />}</>; return item.url ? <a className="commit-row" key={item.id} href={item.url} target="_blank" rel="noreferrer">{content}</a> : <div className="commit-row" key={item.id}>{content}</div> })}</div></section></main><aside className="app-part-side-panel"><div className="component-side-heading"><h2>Arbeitsbereich</h2>{canEdit && <button type="button" onClick={() => setEditOpen(true)}>Bearbeiten</button>}</div><div><span>Projekt</span><Link to={`/projects/${project.id}`}><span className="project-glyph" style={{ background: project.color }}>{project.icon}</span>{project.name}</Link></div><div><span>Aufgaben</span><strong>{linkedFeatures.length}</strong></div><div><span>Commits</span><strong>{appPart.commits.length}</strong></div><div><span>Zustand</span><StatusBadge value={appPart.releaseState} /></div><div className="component-side-people"><span>Gerade aktiv</span><div>{activeUsers.map((person) => <span key={person.id}><Avatar user={person} size="small" /><span><strong>{person.name}</strong><small>{person.jobTitle}</small></span></span>)}{!activeUsers.length && <small>Nicht belegt</small>}</div></div></aside></div>{editOpen && <AppPartEditModal open onClose={() => setEditOpen(false)} appPart={appPart} onSave={(updates) => { updateAppPart(appPart.id, updates); showToast("Komponente gespeichert") }} />}</div>
}

function AppPartEditModal({ open, onClose, appPart, onSave }: { open: boolean; onClose(): void; appPart: AppPart; onSave(updates: Partial<AppPart>): void }) {
  const [input, setInput] = useState({ name: appPart.name, description: appPart.description, platform: appPart.platform, releaseState: appPart.releaseState })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!input.name.trim()) return; onSave({ ...input, name: input.name.trim(), description: input.description.trim() }); onClose() }
  return <Modal open={open} onClose={onClose} title="Komponente bearbeiten"><form className="form-stack" onSubmit={submit}><div className="field-group"><label htmlFor="component-name">Name</label><input id="component-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus /></div><div className="field-group"><label htmlFor="component-description">Beschreibung</label><textarea id="component-description" rows={4} value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} /></div><div className="form-grid"><div className="field-group"><label htmlFor="component-platform">Bereich</label><input id="component-platform" value={input.platform} onChange={(event) => setInput({ ...input, platform: event.target.value })} /></div><div className="field-group"><label htmlFor="component-state">Zustand</label><AppSelect id="component-state" value={input.releaseState} onValueChange={(releaseState) => setInput({ ...input, releaseState: releaseState as ReleaseState })} options={releaseStates.map((state) => ({ value: state, label: state }))} /></div></div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit">Komponente speichern</button></div></form></Modal>
}
