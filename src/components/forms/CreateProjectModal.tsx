import { Check } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import type { ProjectInput, ProjectType } from "../../domain/types"
import { useWorkspace } from "../../state/WorkspaceContext"
import { Avatar } from "../ui/Avatar"
import { Modal } from "../ui/Modal"

const projectTypes: ProjectType[] = ["Mobile App", "Web App", "Desktop App", "Website", "Backend", "API", "Bibliothek", "Browser Erweiterung", "Internes Tool", "Anderes"]
const platforms = ["iOS", "Android", "Web", "macOS", "Windows", "Linux", "Server"]
const colors = ["#6f6f82", "#547063", "#88654f", "#725a78", "#4f687f"]

export function CreateProjectModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const { users, currentUserId, createProject } = useWorkspace()
  const navigate = useNavigate()
  const [input, setInput] = useState<ProjectInput>({
    name: "",
    description: "",
    type: "Mobile App",
    platforms: ["iOS", "Android"],
    memberIds: [currentUserId],
    color: colors[0],
  })
  const [error, setError] = useState("")

  const toggleValue = (key: "platforms" | "memberIds", value: string) => {
    setInput((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!input.name.trim()) {
      setError("Bitte gib dem Projekt einen Namen.")
      return
    }
    let project
    try {
      project = await createProject({ ...input, name: input.name.trim(), description: input.description.trim() })
    } catch {
      setError("Das Projekt konnte nicht erstellt werden.")
      return
    }
    setInput({ name: "", description: "", type: "Mobile App", platforms: ["iOS", "Android"], memberIds: [currentUserId], color: colors[0] })
    setError("")
    onClose()
    navigate(`/projects/${project.id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Projekt erstellen" description="Lege eine App oder ein größeres Softwareprodukt an.">
      <form className="form-stack" onSubmit={submit}>
        <div className="field-group">
          <label htmlFor="project-name">Name</label>
          <input id="project-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus />
          {error && <span className="field-error" role="alert">{error}</span>}
        </div>
        <div className="field-group">
          <label htmlFor="project-description">Beschreibung</label>
          <textarea id="project-description" value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} rows={3} />
        </div>
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="project-type">Projekttyp</label>
            <select id="project-type" value={input.type} onChange={(event) => setInput({ ...input, type: event.target.value as ProjectType })}>
              {projectTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="field-group">
            <span className="field-label">Farbe</span>
            <div className="color-options">
              {colors.map((color) => (
                <button key={color} className={input.color === color ? "color-option selected" : "color-option"} style={{ background: color }} type="button" onClick={() => setInput({ ...input, color })} aria-label={`Farbe ${color}`}>
                  {input.color === color && <Check size={14} color="white" weight="bold" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <fieldset className="field-group">
          <legend>Plattformen</legend>
          <div className="choice-grid">
            {platforms.map((platform) => (
              <label key={platform} className="choice-row">
                <input type="checkbox" checked={input.platforms.includes(platform)} onChange={() => toggleValue("platforms", platform)} />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="field-group">
          <legend>Mitglieder</legend>
          <div className="member-choices">
            {users.map((user) => (
              <label key={user.id} className="member-choice">
                <Avatar user={user} size="small" />
                <span><strong>{user.name}</strong><small>@{user.handle}</small></span>
                <input type="checkbox" checked={input.memberIds.includes(user.id)} onChange={() => toggleValue("memberIds", user.id)} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>Abbrechen</button>
          <button className="button primary" type="submit">Projekt erstellen</button>
        </div>
      </form>
    </Modal>
  )
}
