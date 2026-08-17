import { Check, Cube, Plus, X } from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import type { FeatureInput, FeatureStatus, Priority, Project } from "../../domain/types"
import { featureStatuses, priorities, useWorkspace } from "../../state/WorkspaceContext"
import { Avatar } from "../ui/Avatar"
import { AppSelect } from "../ui/AppSelect"
import { Modal } from "../ui/Modal"

const emptyInput = (project: Project, currentUserId: string): FeatureInput => ({
  projectId: project.id,
  title: "",
  description: "",
  status: "Geplant",
  priority: "Normal",
  targetDate: "",
  memberIds: project.memberIds.includes(currentUserId) ? [currentUserId] : project.memberIds.slice(0, 1),
  appPartIds: [],
})

export function CreateFeatureModal({ open, onClose, project }: { open: boolean; onClose(): void; project?: Project }) {
  const { users, projects, appParts, currentUserId, createFeature } = useWorkspace()
  const navigate = useNavigate()
  const availableProjects = useMemo(() => project ? [project] : projects, [project, projects])
  const initialProject = availableProjects[0]
  const [input, setInput] = useState<FeatureInput>(() => initialProject ? emptyInput(initialProject, currentUserId) : { projectId: "", title: "", description: "", status: "Geplant", priority: "Normal", targetDate: "", memberIds: [], appPartIds: [] })
  const [error, setError] = useState("")
  const selectedProject = availableProjects.find((item) => item.id === input.projectId) ?? initialProject
  const projectUsers = users.filter((user) => selectedProject?.memberIds.includes(user.id))
  const projectAppParts = appParts.filter((appPart) => appPart.projectId === selectedProject?.id)

  const selectProject = (projectId: string) => {
    const nextProject = availableProjects.find((item) => item.id === projectId)
    if (!nextProject) return
    setInput((current) => ({ ...emptyInput(nextProject, currentUserId), title: current.title, description: current.description, status: current.status, priority: current.priority, targetDate: current.targetDate }))
  }

  const toggleMember = (userId: string) => setInput((current) => ({ ...current, memberIds: current.memberIds.includes(userId) ? current.memberIds.filter((id) => id !== userId) : [...current.memberIds, userId] }))
  const toggleAppPart = (appPartId: string) => setInput((current) => ({ ...current, appPartIds: current.appPartIds.includes(appPartId) ? current.appPartIds.filter((id) => id !== appPartId) : [...current.appPartIds, appPartId] }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProject) return setError("Bitte wähle ein Projekt aus.")
    if (!input.title.trim()) return setError("Bitte gib der Aufgabe einen Namen.")
    if (!input.memberIds.length) return setError("Wähle mindestens eine beteiligte Person aus.")
    try {
      const feature = await createFeature({ ...input, title: input.title.trim(), description: input.description.trim() })
      setInput(emptyInput(selectedProject, currentUserId))
      setError("")
      onClose()
      navigate(`/projects/${selectedProject.id}/tasks/${feature.id}`)
    } catch {
      setError("Die Aufgabe konnte nicht erstellt werden.")
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Aufgabe erstellen" description="Plane Verantwortung, Umfang und betroffene Komponenten an einem Ort.">
      <form className="form-stack task-create-form" onSubmit={submit}>
        {!project && <div className="field-group"><label htmlFor="feature-project">Projekt</label><AppSelect id="feature-project" value={input.projectId} onValueChange={selectProject} options={availableProjects.map((item) => ({ value: item.id, label: item.name, description: item.type }))} /></div>}
        <div className="field-group"><label htmlFor="feature-name">Was soll erledigt werden?</label><input id="feature-name" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="Kurzer, konkreter Aufgabentitel" autoFocus />{error && <span className="field-error" role="alert">{error}</span>}</div>
        <div className="field-group"><label htmlFor="feature-description">Kontext</label><textarea id="feature-description" value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} placeholder="Ziel, erwartetes Ergebnis und wichtige Hinweise" rows={3} /></div>
        <div className="form-grid">
          <div className="field-group"><label htmlFor="feature-status">Status</label><AppSelect id="feature-status" value={input.status} onValueChange={(status) => setInput({ ...input, status: status as FeatureStatus })} options={featureStatuses.map((status) => ({ value: status, label: status }))} /></div>
          <div className="field-group"><label htmlFor="feature-priority">Priorität</label><AppSelect id="feature-priority" value={input.priority} onValueChange={(priority) => setInput({ ...input, priority: priority as Priority })} options={priorities.map((priority) => ({ value: priority, label: priority }))} /></div>
        </div>
        <div className="field-group"><label htmlFor="feature-date">Zieltermin</label><input id="feature-date" type="date" value={input.targetDate} onChange={(event) => setInput({ ...input, targetDate: event.target.value })} /></div>
        <fieldset className="field-group component-selector">
          <legend>Betroffene Komponenten</legend>
          <p className="field-helper">Wähle alle technischen Bereiche aus, die durch die Aufgabe verändert werden.</p>
          {input.appPartIds.length > 0 && <div className="selection-chips">{input.appPartIds.map((id) => { const part = projectAppParts.find((item) => item.id === id); return part && <button key={id} type="button" onClick={() => toggleAppPart(id)}><Cube size={14} />{part.name}<X size={13} /></button> })}</div>}
          <div className="component-choice-grid">{projectAppParts.map((appPart) => <button key={appPart.id} type="button" className={input.appPartIds.includes(appPart.id) ? "component-choice selected" : "component-choice"} onClick={() => toggleAppPart(appPart.id)}><span><Cube size={16} /><span><strong>{appPart.name}</strong><small>{appPart.platform}</small></span></span>{input.appPartIds.includes(appPart.id) ? <Check size={15} weight="bold" /> : <Plus size={15} />}</button>)}{!projectAppParts.length && <span className="field-helper">In diesem Projekt gibt es noch keine Komponenten.</span>}</div>
        </fieldset>
        <fieldset className="field-group"><legend>Beteiligte Personen</legend><p className="field-helper">Die zuerst gewählte Person übernimmt die Leitung. Weitere Personen können später jederzeit ergänzt werden.</p><div className="member-choices">{projectUsers.map((user) => <label key={user.id} className="member-choice"><Avatar user={user} size="small" /><span><strong>{user.name}</strong><small>@{user.handle}</small></span><input type="checkbox" checked={input.memberIds.includes(user.id)} onChange={() => toggleMember(user.id)} /></label>)}</div></fieldset>
        <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit">Aufgabe erstellen</button></div>
      </form>
    </Modal>
  )
}
