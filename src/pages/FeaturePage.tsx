import { ArrowLeft, CalendarBlank, Check, CheckCircle, PencilSimple, Plus, UserPlus } from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { Avatar, AvatarGroup } from "../components/ui/Avatar"
import { Modal } from "../components/ui/Modal"
import { ProgressRing } from "../components/ui/ProgressRing"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { Feature, FeatureMember, FeatureRole, FeatureStatus, Health, Priority } from "../domain/types"
import { featureStatuses, priorities, useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"
import { featureProgress, formatDate, relativeDate } from "../utils/format"

type Tab = "Überblick" | "Anforderungen" | "Updates" | "Aktivität"

export function FeaturePage() {
  const { projectId, featureId } = useParams()
  const { projects, features, appParts, users, toggleRequirement, addRequirement, addUpdate, updateFeature, setFeatureMembers } = useWorkspace()
  const { showToast } = useToast()
  const feature = features.find((item) => item.id === featureId)
  const project = projects.find((item) => item.id === projectId)
  const [activeTab, setActiveTab] = useState<Tab>("Überblick")
  const [requirementTitle, setRequirementTitle] = useState("")
  const [updateText, setUpdateText] = useState("")
  const [updateHealth, setUpdateHealth] = useState<Health>(feature?.health ?? "Im Plan")
  const [membersOpen, setMembersOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!feature || !project) return <div className="page"><div className="empty-state"><strong>Feature nicht gefunden</strong></div></div>

  const featureUsers = users.filter((user) => feature.members.some((member) => member.userId === user.id))
  const projectAppParts = appParts.filter((appPart) => appPart.projectId === project.id)
  const linkedAppPart = projectAppParts.find((appPart) => appPart.id === feature.appPartId)
  const leadMember = feature.members.find((member) => member.role === "Lead")
  const lead = users.find((user) => user.id === leadMember?.userId)
  const progress = featureProgress(feature)

  const submitRequirement = (event: FormEvent) => {
    event.preventDefault()
    if (!requirementTitle.trim()) return
    addRequirement(feature.id, requirementTitle.trim())
    setRequirementTitle("")
  }

  const submitUpdate = (event: FormEvent) => {
    event.preventDefault()
    if (!updateText.trim()) return
    addUpdate(feature.id, updateText.trim(), updateHealth)
    setUpdateText("")
  }

  const tabs: Tab[] = ["Überblick", "Anforderungen", "Updates", "Aktivität"]

  return (
    <div className="feature-page">
      <div className="feature-page-header">
        <div className="breadcrumbs"><Link to={`/projects/${project.id}`}><ArrowLeft size={15} />{project.name}</Link><span>/</span><span>{feature.key}</span></div>
        <div className="feature-heading-row">
          <div><span className="feature-key heading-key">{feature.key}</span><h1>{feature.title}</h1></div>
          <div className="feature-heading-actions"><AvatarGroup users={featureUsers} limit={5} /><button className="button secondary" type="button" onClick={() => setEditOpen(true)}><PencilSimple size={16} />Bearbeiten</button><button className="button secondary" type="button" onClick={() => setMembersOpen(true)}><UserPlus size={16} />Personen</button></div>
        </div>
        <p className="feature-summary">{feature.description}</p>
        {linkedAppPart && <Link className="feature-app-part-link" to={`/product/app-parts/${linkedAppPart.id}`}><span>Betroffener App Teil</span><strong>{linkedAppPart.name}</strong><StatusBadge value={linkedAppPart.releaseState} /></Link>}
        <div className="feature-tabs" role="tablist" aria-label="Feature Bereiche">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      </div>

      <div className="feature-content">
        <div className="feature-main">
          {activeTab === "Überblick" && <><section className="content-section"><div className="section-heading"><h2>Fortschritt</h2><span>{feature.requirements.filter((item) => item.completed).length} von {feature.requirements.length} Anforderungen</span></div><div className="progress-overview"><ProgressRing value={progress} size={64} /><div><strong>{progress} Prozent abgeschlossen</strong><p>Der Fortschritt wird aus den erfüllten Anforderungen berechnet.</p></div></div></section><RequirementsSection featureId={feature.id} requirements={feature.requirements} requirementTitle={requirementTitle} setRequirementTitle={setRequirementTitle} submitRequirement={submitRequirement} toggleRequirement={toggleRequirement} compact /><UpdatesSection feature={feature} users={users} updateText={updateText} setUpdateText={setUpdateText} updateHealth={updateHealth} setUpdateHealth={setUpdateHealth} submitUpdate={submitUpdate} compact /></>}
          {activeTab === "Anforderungen" && <RequirementsSection featureId={feature.id} requirements={feature.requirements} requirementTitle={requirementTitle} setRequirementTitle={setRequirementTitle} submitRequirement={submitRequirement} toggleRequirement={toggleRequirement} />}
          {activeTab === "Updates" && <UpdatesSection feature={feature} users={users} updateText={updateText} setUpdateText={setUpdateText} updateHealth={updateHealth} setUpdateHealth={setUpdateHealth} submitUpdate={submitUpdate} />}
          {activeTab === "Aktivität" && <ActivitySection feature={feature} users={users} />}
        </div>

        <aside className="feature-sidebar" aria-label="Feature Eigenschaften">
          <div className="property-row"><span>Status</span><select value={feature.status} onChange={(event) => updateFeature(feature.id, { status: event.target.value as FeatureStatus })}>{featureStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="property-row"><span>Priorität</span><select value={feature.priority} onChange={(event) => updateFeature(feature.id, { priority: event.target.value as Priority })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></div>
          <div className="property-row"><span>Gesundheit</span><select value={feature.health} onChange={(event) => updateFeature(feature.id, { health: event.target.value as Health })}><option>Im Plan</option><option>Gefährdet</option><option>Blockiert</option></select></div>
          <div className="property-row"><span>App Teil</span><select value={feature.appPartId} onChange={(event) => { updateFeature(feature.id, { appPartId: event.target.value }); showToast("App Teil verknüpft") }}><option value="">Nicht verknüpft</option>{projectAppParts.map((appPart) => <option key={appPart.id} value={appPart.id}>{appPart.name}</option>)}</select></div>
          <div className="property-divider" />
          <div className="property-row static"><span>Feature Lead</span>{lead ? <span className="person-value"><Avatar user={lead} size="small" />{lead.name}</span> : <span>Nicht festgelegt</span>}</div>
          <div className="property-row static"><span>Beteiligte</span><AvatarGroup users={featureUsers} /></div>
          <div className="property-divider" />
          <div className="property-row static"><span>Start</span><span><CalendarBlank size={15} />{formatDate(feature.startDate)}</span></div>
          <div className="property-row static"><span>Ziel</span><span><CalendarBlank size={15} />{formatDate(feature.targetDate)}</span></div>
          <div className="property-row static"><span>Aufwand</span><span>{feature.estimate}</span></div>
          <div className="property-divider" />
          <div className="property-row static"><span>Projekt</span><Link to={`/projects/${project.id}`}><span className="project-glyph" style={{ background: project.color }}>{project.icon}</span>{project.name}</Link></div>
        </aside>
      </div>

      {membersOpen && <MembersModal open onClose={() => setMembersOpen(false)} featureMembers={feature.members} projectMemberIds={project.memberIds} users={users} onSave={(members) => setFeatureMembers(feature.id, members)} />}
      {editOpen && <FeatureEditModal open onClose={() => setEditOpen(false)} feature={feature} onSave={(updates) => { updateFeature(feature.id, updates); showToast("Feature gespeichert") }} />}
    </div>
  )
}

function RequirementsSection({ featureId, requirements, requirementTitle, setRequirementTitle, submitRequirement, toggleRequirement, compact = false }: { featureId: string; requirements: { id: string; title: string; completed: boolean }[]; requirementTitle: string; setRequirementTitle(value: string): void; submitRequirement(event: FormEvent): void; toggleRequirement(featureId: string, requirementId: string): void; compact?: boolean }) {
  const shown = compact ? requirements.slice(0, 4) : requirements
  return <section className="content-section"><div className="section-heading"><h2>Anforderungen</h2><span>{requirements.filter((item) => item.completed).length} von {requirements.length} erfüllt</span></div><div className="requirement-list">{shown.map((requirement) => <label key={requirement.id} className={requirement.completed ? "requirement-row completed" : "requirement-row"}><input type="checkbox" checked={requirement.completed} onChange={() => toggleRequirement(featureId, requirement.id)} /><span className="custom-check">{requirement.completed && <Check size={13} weight="bold" />}</span><span>{requirement.title}</span></label>)}</div>{!compact && <form className="inline-create" onSubmit={submitRequirement}><Plus size={16} /><label className="visually-hidden" htmlFor="new-requirement">Anforderung hinzufügen</label><input id="new-requirement" value={requirementTitle} onChange={(event) => setRequirementTitle(event.target.value)} placeholder="Anforderung hinzufügen" /><button type="submit" disabled={!requirementTitle.trim()}>Hinzufügen</button></form>}{!requirements.length && <div className="empty-state"><CheckCircle size={24} /><strong>Noch keine Anforderungen</strong><span>Beschreibe, was dieses Feature erfüllen muss.</span></div>}</section>
}

function UpdatesSection({ feature, users, updateText, setUpdateText, updateHealth, setUpdateHealth, submitUpdate, compact = false }: { feature: Feature; users: ReturnType<typeof useWorkspace>["users"]; updateText: string; setUpdateText(value: string): void; updateHealth: Health; setUpdateHealth(value: Health): void; submitUpdate(event: FormEvent): void; compact?: boolean }) {
  const updates = compact ? feature.updates.slice(0, 2) : feature.updates
  return <section className="content-section"><div className="section-heading"><h2>Updates</h2><span>{feature.updates.length} Beiträge</span></div>{!compact && <form className="update-composer" onSubmit={submitUpdate}><label htmlFor="feature-update">Neues Update</label><textarea id="feature-update" value={updateText} onChange={(event) => setUpdateText(event.target.value)} rows={4} placeholder="Was hat sich seit dem letzten Update verändert?" /><div><select value={updateHealth} onChange={(event) => setUpdateHealth(event.target.value as Health)} aria-label="Gesundheitsstatus"><option>Im Plan</option><option>Gefährdet</option><option>Blockiert</option></select><button className="button primary" type="submit" disabled={!updateText.trim()}>Update veröffentlichen</button></div></form>}<div className="update-list">{updates.map((update) => { const author = users.find((user) => user.id === update.authorId); return <article key={update.id} className="update-card"><div className="update-author">{author && <Avatar user={author} size="small" />}<div><strong>{author?.name}</strong><span>{relativeDate(update.createdAt)}</span></div><StatusBadge value={update.health} /></div><p>{update.message}</p></article> })}</div>{!updates.length && <div className="empty-state"><CheckCircle size={24} /><strong>Noch keine Updates</strong><span>Veröffentliche den ersten Fortschrittsbericht.</span></div>}</section>
}

function ActivitySection({ feature, users }: { feature: Feature; users: ReturnType<typeof useWorkspace>["users"] }) {
  const entries = useMemo(() => [...feature.updates.map((update) => ({ id: update.id, text: "hat ein Update veröffentlicht", userId: update.authorId, date: update.createdAt })), { id: `created-${feature.id}`, text: "hat das Feature erstellt", userId: feature.members[0]?.userId, date: feature.createdAt }].sort((a, b) => b.date.localeCompare(a.date)), [feature])
  return <section className="content-section"><div className="section-heading"><h2>Aktivität</h2><span>Vollständiger Verlauf</span></div><div className="timeline">{entries.map((entry) => { const user = users.find((item) => item.id === entry.userId); return <div key={entry.id} className="timeline-entry">{user && <Avatar user={user} size="small" />}<div><p><strong>{user?.name}</strong> {entry.text}</p><span>{relativeDate(entry.date)}</span></div></div> })}</div></section>
}

function MembersModal({ open, onClose, featureMembers, projectMemberIds, users, onSave }: { open: boolean; onClose(): void; featureMembers: FeatureMember[]; projectMemberIds: string[]; users: ReturnType<typeof useWorkspace>["users"]; onSave(members: FeatureMember[]): void }) {
  const [members, setMembers] = useState<FeatureMember[]>(featureMembers)
  const projectUsers = users.filter((user) => projectMemberIds.includes(user.id))
  const toggle = (userId: string) => setMembers((current) => current.some((member) => member.userId === userId) ? current.filter((member) => member.userId !== userId) : [...current, { userId, role: current.length ? "Beteiligte" : "Lead" }])
  const setRole = (userId: string, role: FeatureRole) => setMembers((current) => current.map((member) => member.userId === userId ? { ...member, role } : member))
  return <Modal open={open} onClose={onClose} title="Personen verwalten" description="Lege fest, wer an diesem Feature beteiligt ist."><div className="member-editor">{projectUsers.map((user) => { const member = members.find((item) => item.userId === user.id); return <div key={user.id} className="member-editor-row"><label><input type="checkbox" checked={Boolean(member)} onChange={() => toggle(user.id)} /><Avatar user={user} size="small" /><span><strong>{user.name}</strong><small>@{user.handle}</small></span></label>{member && <select value={member.role} onChange={(event) => setRole(user.id, event.target.value as FeatureRole)}><option>Lead</option><option>Beteiligte</option><option>Review</option></select>}</div> })}</div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="button" disabled={!members.length} onClick={() => { onSave(members); onClose() }}>Speichern</button></div></Modal>
}

function FeatureEditModal({ open, onClose, feature, onSave }: { open: boolean; onClose(): void; feature: Feature; onSave(updates: Partial<Feature>): void }) {
  const [input, setInput] = useState({ title: feature.title, description: feature.description, startDate: feature.startDate, targetDate: feature.targetDate, estimate: feature.estimate })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!input.title.trim()) return; onSave({ ...input, title: input.title.trim(), description: input.description.trim() }); onClose() }
  return <Modal open={open} onClose={onClose} title="Feature bearbeiten" description="Passe Inhalt, Zeitraum und Aufwand an."><form className="form-stack" onSubmit={submit}><div className="field-group"><label htmlFor="edit-feature-title">Name</label><input id="edit-feature-title" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} autoFocus /></div><div className="field-group"><label htmlFor="edit-feature-description">Beschreibung</label><textarea id="edit-feature-description" rows={4} value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} /></div><div className="form-grid"><div className="field-group"><label htmlFor="edit-feature-start">Start</label><input id="edit-feature-start" type="date" value={input.startDate} onChange={(event) => setInput({ ...input, startDate: event.target.value })} /></div><div className="field-group"><label htmlFor="edit-feature-target">Ziel</label><input id="edit-feature-target" type="date" value={input.targetDate} onChange={(event) => setInput({ ...input, targetDate: event.target.value })} /></div></div><div className="field-group"><label htmlFor="edit-feature-estimate">Aufwand</label><input id="edit-feature-estimate" value={input.estimate} onChange={(event) => setInput({ ...input, estimate: event.target.value })} placeholder="Zum Beispiel 4 Tage" /></div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit">Feature speichern</button></div></form></Modal>
}
