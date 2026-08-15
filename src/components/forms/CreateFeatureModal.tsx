import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import type { FeatureInput, FeatureStatus, Priority, Project } from "../../domain/types"
import { featureStatuses, priorities, useWorkspace } from "../../state/WorkspaceContext"
import { Avatar } from "../ui/Avatar"
import { Modal } from "../ui/Modal"

export function CreateFeatureModal({ open, onClose, project }: { open: boolean; onClose(): void; project: Project }) {
  const { users, createFeature } = useWorkspace()
  const navigate = useNavigate()
  const [input, setInput] = useState<FeatureInput>({
    projectId: project.id,
    title: "",
    description: "",
    status: "Geplant",
    priority: "Normal",
    targetDate: "",
    memberIds: project.memberIds.slice(0, 1),
  })
  const [error, setError] = useState("")
  const projectUsers = users.filter((user) => project.memberIds.includes(user.id))

  const toggleMember = (userId: string) => {
    setInput((current) => ({
      ...current,
      memberIds: current.memberIds.includes(userId) ? current.memberIds.filter((id) => id !== userId) : [...current.memberIds, userId],
    }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!input.title.trim()) {
      setError("Bitte gib dem Feature einen Namen.")
      return
    }
    if (!input.memberIds.length) {
      setError("Wähle mindestens eine beteiligte Person aus.")
      return
    }
    const feature = createFeature({ ...input, title: input.title.trim(), description: input.description.trim() })
    setInput({ projectId: project.id, title: "", description: "", status: "Geplant", priority: "Normal", targetDate: "", memberIds: project.memberIds.slice(0, 1) })
    setError("")
    onClose()
    navigate(`/projects/${project.id}/features/${feature.id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Feature erstellen" description={`Neues Feature für ${project.name}`}>
      <form className="form-stack" onSubmit={submit}>
        <div className="field-group">
          <label htmlFor="feature-name">Name</label>
          <input id="feature-name" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} autoFocus />
          {error && <span className="field-error" role="alert">{error}</span>}
        </div>
        <div className="field-group">
          <label htmlFor="feature-description">Beschreibung</label>
          <textarea id="feature-description" value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} rows={3} />
        </div>
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="feature-status">Status</label>
            <select id="feature-status" value={input.status} onChange={(event) => setInput({ ...input, status: event.target.value as FeatureStatus })}>
              {featureStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="feature-priority">Priorität</label>
            <select id="feature-priority" value={input.priority} onChange={(event) => setInput({ ...input, priority: event.target.value as Priority })}>
              {priorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="feature-date">Zieltermin</label>
          <input id="feature-date" type="date" value={input.targetDate} onChange={(event) => setInput({ ...input, targetDate: event.target.value })} />
        </div>
        <fieldset className="field-group">
          <legend>Beteiligte Personen</legend>
          <p className="field-helper">Die zuerst gewählte Person übernimmt die Leitung.</p>
          <div className="member-choices">
            {projectUsers.map((user) => (
              <label key={user.id} className="member-choice">
                <Avatar user={user} size="small" />
                <span><strong>{user.name}</strong><small>@{user.handle}</small></span>
                <input type="checkbox" checked={input.memberIds.includes(user.id)} onChange={() => toggleMember(user.id)} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>Abbrechen</button>
          <button className="button primary" type="submit">Feature erstellen</button>
        </div>
      </form>
    </Modal>
  )
}
