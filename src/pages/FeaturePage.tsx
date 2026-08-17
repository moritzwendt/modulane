import { ArrowLeft, CalendarBlank, Check, CheckCircle, Cube, PencilSimple, Plus, UserPlus, Warning, X } from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { Avatar, AvatarGroup } from "../components/ui/Avatar"
import { AppSelect } from "../components/ui/AppSelect"
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
  const { projects, features, appParts, users, currentUserId, toggleRequirement, addRequirement, addUpdate, updateFeature, setFeatureMembers } = useWorkspace()
  const { showToast } = useToast()
  const feature = features.find((item) => item.id === featureId)
  const project = projects.find((item) => item.id === projectId)
  const [activeTab, setActiveTab] = useState<Tab>("Überblick")
  const [requirementTitle, setRequirementTitle] = useState("")
  const [updateText, setUpdateText] = useState("")
  const [updateHealth, setUpdateHealth] = useState<Health>(feature?.health ?? "Im Plan")
  const [membersOpen, setMembersOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [componentsOpen, setComponentsOpen] = useState(false)

  if (!feature || !project) return <div className="page"><div className="empty-state"><strong>Aufgabe nicht gefunden</strong></div></div>

  const featureUsers = users.filter((user) => feature.members.some((member) => member.userId === user.id))
  const projectAppParts = appParts.filter((appPart) => appPart.projectId === project.id)
  const linkedAppParts = projectAppParts.filter((appPart) => feature.appPartIds.includes(appPart.id))
  const occupiedAppParts = linkedAppParts.filter((appPart) => appPart.activeUserIds.some((userId) => userId !== currentUserId))
  const occupancySummary = occupiedAppParts.map((appPart) => {
    const names = users.filter((user) => appPart.activeUserIds.includes(user.id) && user.id !== currentUserId).map((user) => user.name)
    return `${appPart.name} wird von ${names.join(", ")} bearbeitet`
  }).join(". ")
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
        <div className="task-context-bar">
          <div className="task-context-people"><span>Personen</span><button type="button" onClick={() => setMembersOpen(true)}><AvatarGroup users={featureUsers} limit={5} /><Plus size={14} /></button></div>
          <div className="task-context-components"><span>Komponenten</span><div>{linkedAppParts.map((appPart) => { const occupied = appPart.activeUserIds.some((userId) => userId !== currentUserId); return <span className={occupied ? "task-component-chip occupied" : "task-component-chip"} key={appPart.id}>{occupied && <Warning size={13} weight="fill" />}<Link to={`/components/${appPart.id}`}><Cube size={14} />{appPart.name}</Link><button type="button" aria-label={`${appPart.name} entfernen`} onClick={() => { updateFeature(feature.id, { appPartIds: feature.appPartIds.filter((id) => id !== appPart.id) }); showToast("Komponente entfernt") }}><X size={12} /></button></span> })}<button className="task-add-context" type="button" onClick={() => setComponentsOpen(true)}><Plus size={14} />{linkedAppParts.length ? "Ergänzen" : "Verknüpfen"}</button></div></div>
        </div>
        {occupiedAppParts.length > 0 && <div className="component-work-warning" role="status"><Warning size={20} weight="fill" /><div><strong>{occupiedAppParts.length === 1 ? "Komponente bereits belegt" : "Komponenten bereits belegt"}</strong><span>{occupancySummary}. Stimme parallele Änderungen vorher ab.</span></div></div>}
        <div className="feature-tabs" role="tablist" aria-label="Aufgabenbereiche">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      </div>

      <div className="feature-content">
        <div className="feature-main">
          {activeTab === "Überblick" && <><section className="content-section"><div className="section-heading"><h2>Fortschritt</h2><span>{feature.requirements.filter((item) => item.completed).length} von {feature.requirements.length} Anforderungen</span></div><div className="progress-overview"><ProgressRing value={progress} size={64} /><div><strong>{progress} Prozent abgeschlossen</strong><p>Der Fortschritt wird aus den erfüllten Anforderungen berechnet.</p></div></div></section><RequirementsSection featureId={feature.id} requirements={feature.requirements} requirementTitle={requirementTitle} setRequirementTitle={setRequirementTitle} submitRequirement={submitRequirement} toggleRequirement={toggleRequirement} compact /><UpdatesSection feature={feature} users={users} updateText={updateText} setUpdateText={setUpdateText} updateHealth={updateHealth} setUpdateHealth={setUpdateHealth} submitUpdate={submitUpdate} compact /></>}
          {activeTab === "Anforderungen" && <RequirementsSection featureId={feature.id} requirements={feature.requirements} requirementTitle={requirementTitle} setRequirementTitle={setRequirementTitle} submitRequirement={submitRequirement} toggleRequirement={toggleRequirement} />}
          {activeTab === "Updates" && <UpdatesSection feature={feature} users={users} updateText={updateText} setUpdateText={setUpdateText} updateHealth={updateHealth} setUpdateHealth={setUpdateHealth} submitUpdate={submitUpdate} />}
          {activeTab === "Aktivität" && <ActivitySection feature={feature} users={users} />}
        </div>

        <aside className="feature-sidebar" aria-label="Aufgabeneigenschaften">
          <div className="property-row"><span>Status</span><AppSelect compact value={feature.status} onValueChange={(status) => updateFeature(feature.id, { status: status as FeatureStatus })} ariaLabel="Aufgabenstatus" options={featureStatuses.map((status) => ({ value: status, label: status }))} /></div>
          <div className="property-row"><span>Priorität</span><AppSelect compact value={feature.priority} onValueChange={(priority) => updateFeature(feature.id, { priority: priority as Priority })} ariaLabel="Aufgabenpriorität" options={priorities.map((priority) => ({ value: priority, label: priority }))} /></div>
          <div className="property-row"><span>Gesundheit</span><AppSelect compact value={feature.health} onValueChange={(health) => updateFeature(feature.id, { health: health as Health })} ariaLabel="Gesundheit der Aufgabe" options={["Im Plan", "Gefährdet", "Blockiert"].map((health) => ({ value: health, label: health }))} /></div>
          <div className="property-divider" />
          <div className="task-side-section"><div className="task-side-heading"><span>Personen</span><button type="button" onClick={() => setMembersOpen(true)}><Plus size={14} />Hinzufügen</button></div>{featureUsers.map((person) => { const membership = feature.members.find((member) => member.userId === person.id); return <button className="task-person-row" key={person.id} type="button" onClick={() => setMembersOpen(true)}><Avatar user={person} size="small" /><span><strong>{person.name}</strong><small>{membership?.role}</small></span></button> })}</div>
          <div className="property-row static"><span>Aufgaben Lead</span>{lead ? <span className="person-value"><Avatar user={lead} size="small" />{lead.name}</span> : <span>Nicht festgelegt</span>}</div>
          <div className="property-divider" />
          <div className="property-row static"><span>Start</span><span><CalendarBlank size={15} />{formatDate(feature.startDate)}</span></div>
          <div className="property-row static"><span>Ziel</span><span><CalendarBlank size={15} />{formatDate(feature.targetDate)}</span></div>
          <div className="property-row static"><span>Aufwand</span><span>{feature.estimate}</span></div>
          <div className="property-divider" />
          <div className="property-row static"><span>Projekt</span><Link to={`/projects/${project.id}`}><span className="project-glyph" style={{ background: project.color }}>{project.icon}</span>{project.name}</Link></div>
        </aside>
      </div>

      {membersOpen && <MembersModal open onClose={() => setMembersOpen(false)} featureMembers={feature.members} projectMemberIds={project.memberIds} users={users} onSave={(members) => setFeatureMembers(feature.id, members)} />}
      {componentsOpen && <ComponentsModal open onClose={() => setComponentsOpen(false)} appParts={projectAppParts} selectedIds={feature.appPartIds} onSave={(appPartIds) => { updateFeature(feature.id, { appPartIds }); showToast("Komponenten gespeichert") }} />}
      {editOpen && <FeatureEditModal open onClose={() => setEditOpen(false)} feature={feature} onSave={(updates) => { updateFeature(feature.id, updates); showToast("Aufgabe gespeichert") }} />}
    </div>
  )
}

function ComponentsModal({ open, onClose, appParts, selectedIds, onSave }: { open: boolean; onClose(): void; appParts: ReturnType<typeof useWorkspace>["appParts"]; selectedIds: string[]; onSave(ids: string[]): void }) {
  const { users, currentUserId } = useWorkspace()
  const [selected, setSelected] = useState(selectedIds)
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <Modal open={open} onClose={onClose} title="Komponenten verknüpfen"><div className="component-choice-grid modal-component-grid">{appParts.map((appPart) => { const activeUsers = users.filter((user) => appPart.activeUserIds.includes(user.id) && user.id !== currentUserId); return <button key={appPart.id} type="button" className={selected.includes(appPart.id) ? "component-choice selected" : "component-choice"} onClick={() => toggle(appPart.id)}><span><Cube size={16} /><span><strong>{appPart.name}</strong><small>{appPart.platform}</small>{activeUsers.length > 0 && <small className="component-occupancy"><Warning size={12} weight="fill" />Belegt von {activeUsers.map((user) => user.name).join(", ")}</small>}</span></span>{selected.includes(appPart.id) ? <Check size={15} weight="bold" /> : <Plus size={15} />}</button> })}</div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="button" onClick={() => { onSave(selected); onClose() }}>Auswahl speichern</button></div></Modal>
}

function RequirementsSection({ featureId, requirements, requirementTitle, setRequirementTitle, submitRequirement, toggleRequirement, compact = false }: { featureId: string; requirements: { id: string; title: string; completed: boolean }[]; requirementTitle: string; setRequirementTitle(value: string): void; submitRequirement(event: FormEvent): void; toggleRequirement(featureId: string, requirementId: string): void; compact?: boolean }) {
  const shown = compact ? requirements.slice(0, 4) : requirements
  return <section className="content-section"><div className="section-heading"><h2>Anforderungen</h2><span>{requirements.filter((item) => item.completed).length} von {requirements.length} erfüllt</span></div><div className="requirement-list">{shown.map((requirement) => <label key={requirement.id} className={requirement.completed ? "requirement-row completed" : "requirement-row"}><input type="checkbox" checked={requirement.completed} onChange={() => toggleRequirement(featureId, requirement.id)} /><span className="custom-check">{requirement.completed && <Check size={13} weight="bold" />}</span><span>{requirement.title}</span></label>)}</div>{!compact && <form className="inline-create" onSubmit={submitRequirement}><Plus size={16} /><label className="visually-hidden" htmlFor="new-requirement">Anforderung hinzufügen</label><input id="new-requirement" value={requirementTitle} onChange={(event) => setRequirementTitle(event.target.value)} placeholder="Anforderung hinzufügen" /><button type="submit" disabled={!requirementTitle.trim()}>Hinzufügen</button></form>}{!requirements.length && <div className="empty-state"><CheckCircle size={24} /><strong>Noch keine Anforderungen</strong><span>Beschreibe, was diese Aufgabe erfüllen muss.</span></div>}</section>
}

function UpdatesSection({ feature, users, updateText, setUpdateText, updateHealth, setUpdateHealth, submitUpdate, compact = false }: { feature: Feature; users: ReturnType<typeof useWorkspace>["users"]; updateText: string; setUpdateText(value: string): void; updateHealth: Health; setUpdateHealth(value: Health): void; submitUpdate(event: FormEvent): void; compact?: boolean }) {
  const updates = compact ? feature.updates.slice(0, 2) : feature.updates
  return <section className="content-section"><div className="section-heading"><h2>Updates</h2><span>{feature.updates.length} Beiträge</span></div>{!compact && <form className="update-composer" onSubmit={submitUpdate}><label htmlFor="feature-update">Neues Update</label><textarea id="feature-update" value={updateText} onChange={(event) => setUpdateText(event.target.value)} rows={4} placeholder="Was hat sich seit dem letzten Update verändert?" /><div><AppSelect compact value={updateHealth} onValueChange={(health) => setUpdateHealth(health as Health)} ariaLabel="Gesundheitsstatus" options={["Im Plan", "Gefährdet", "Blockiert"].map((health) => ({ value: health, label: health }))} /><button className="button primary" type="submit" disabled={!updateText.trim()}>Update veröffentlichen</button></div></form>}<div className="update-list">{updates.map((update) => { const author = users.find((user) => user.id === update.authorId); return <article key={update.id} className="update-card"><div className="update-author">{author && <Avatar user={author} size="small" />}<div><strong>{author?.name}</strong><span>{relativeDate(update.createdAt)}</span></div><StatusBadge value={update.health} /></div><p>{update.message}</p></article> })}</div>{!updates.length && <div className="empty-state"><CheckCircle size={24} /><strong>Noch keine Updates</strong><span>Veröffentliche den ersten Fortschrittsbericht.</span></div>}</section>
}

function ActivitySection({ feature, users }: { feature: Feature; users: ReturnType<typeof useWorkspace>["users"] }) {
  const entries = useMemo(() => [...feature.updates.map((update) => ({ id: update.id, text: "hat ein Update veröffentlicht", userId: update.authorId, date: update.createdAt })), { id: `created-${feature.id}`, text: "hat die Aufgabe erstellt", userId: feature.members[0]?.userId, date: feature.createdAt }].sort((a, b) => b.date.localeCompare(a.date)), [feature])
  return <section className="content-section"><div className="section-heading"><h2>Aktivität</h2><span>Vollständiger Verlauf</span></div><div className="timeline">{entries.map((entry) => { const user = users.find((item) => item.id === entry.userId); return <div key={entry.id} className="timeline-entry">{user && <Avatar user={user} size="small" />}<div><p><strong>{user?.name}</strong> {entry.text}</p><span>{relativeDate(entry.date)}</span></div></div> })}</div></section>
}

function MembersModal({ open, onClose, featureMembers, projectMemberIds, users, onSave }: { open: boolean; onClose(): void; featureMembers: FeatureMember[]; projectMemberIds: string[]; users: ReturnType<typeof useWorkspace>["users"]; onSave(members: FeatureMember[]): void }) {
  const [members, setMembers] = useState<FeatureMember[]>(featureMembers)
  const projectUsers = users.filter((user) => projectMemberIds.includes(user.id))
  const toggle = (userId: string) => setMembers((current) => {
    const removed = current.find((member) => member.userId === userId)
    if (!removed) return [...current, { userId, role: current.length ? "Beteiligte" : "Lead" }]
    const remaining = current.filter((member) => member.userId !== userId)
    if (removed.role === "Lead" && remaining.length && !remaining.some((member) => member.role === "Lead")) return remaining.map((member, index) => index === 0 ? { ...member, role: "Lead" } : member)
    return remaining
  })
  const setRole = (userId: string, role: FeatureRole) => setMembers((current) => current.map((member) => member.userId === userId ? { ...member, role } : role === "Lead" && member.role === "Lead" ? { ...member, role: "Beteiligte" } : member))
  return <Modal open={open} onClose={onClose} title="Personen verwalten" description="Lege fest, wer an dieser Aufgabe beteiligt ist."><div className="member-editor">{projectUsers.map((user) => { const member = members.find((item) => item.userId === user.id); return <div key={user.id} className="member-editor-row"><label><input type="checkbox" checked={Boolean(member)} onChange={() => toggle(user.id)} /><Avatar user={user} size="small" /><span><strong>{user.name}</strong><small>@{user.handle}</small></span></label>{member && <AppSelect compact value={member.role} onValueChange={(role) => setRole(user.id, role as FeatureRole)} ariaLabel={`Aufgabenrolle für ${user.name}`} options={["Lead", "Beteiligte", "Review"].map((role) => ({ value: role, label: role }))} />}</div> })}</div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="button" disabled={!members.length} onClick={() => { onSave(members); onClose() }}>Speichern</button></div></Modal>
}

function FeatureEditModal({ open, onClose, feature, onSave }: { open: boolean; onClose(): void; feature: Feature; onSave(updates: Partial<Feature>): void }) {
  const [input, setInput] = useState({ title: feature.title, description: feature.description, startDate: feature.startDate, targetDate: feature.targetDate, estimate: feature.estimate })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!input.title.trim()) return; onSave({ ...input, title: input.title.trim(), description: input.description.trim() }); onClose() }
  return <Modal open={open} onClose={onClose} title="Aufgabe bearbeiten" description="Passe Inhalt, Zeitraum und Aufwand an."><form className="form-stack" onSubmit={submit}><div className="field-group"><label htmlFor="edit-feature-title">Name</label><input id="edit-feature-title" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} autoFocus /></div><div className="field-group"><label htmlFor="edit-feature-description">Beschreibung</label><textarea id="edit-feature-description" rows={4} value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} /></div><div className="form-grid"><div className="field-group"><label htmlFor="edit-feature-start">Start</label><input id="edit-feature-start" type="date" value={input.startDate} onChange={(event) => setInput({ ...input, startDate: event.target.value })} /></div><div className="field-group"><label htmlFor="edit-feature-target">Ziel</label><input id="edit-feature-target" type="date" value={input.targetDate} onChange={(event) => setInput({ ...input, targetDate: event.target.value })} /></div></div><div className="field-group"><label htmlFor="edit-feature-estimate">Aufwand</label><input id="edit-feature-estimate" value={input.estimate} onChange={(event) => setInput({ ...input, estimate: event.target.value })} placeholder="Zum Beispiel 4 Tage" /></div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit">Aufgabe speichern</button></div></form></Modal>
}
