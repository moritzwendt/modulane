import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import type { AppPartInput, ReleaseState } from "../../domain/types"
import { releaseStates, useWorkspace } from "../../state/WorkspaceContext"
import { AppSelect } from "../ui/AppSelect"
import { Modal } from "../ui/Modal"

export function CreateAppPartModal({ open, onClose, initialProjectId = "" }: { open: boolean; onClose(): void; initialProjectId?: string }) {
  const { projects, users, currentUserId, createAppPart } = useWorkspace()
  const navigate = useNavigate()
  const defaultProjectId = initialProjectId || projects[0]?.id || ""
  const [input, setInput] = useState<AppPartInput>({ projectId: defaultProjectId, name: "", description: "", platform: "", releaseState: "Frei", ownerUserId: "" })
  const [error, setError] = useState("")

  const project = projects.find((item) => item.id === input.projectId)
  const availableUsers = users.filter((user) => project?.memberIds.includes(user.id))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!input.name.trim()) {
      setError("Bitte gib der Komponente einen Namen.")
      return
    }
    let appPart
    try {
      appPart = await createAppPart({ ...input, name: input.name.trim(), description: input.description.trim(), platform: input.platform.trim() || project?.platforms.join(", ") || "Allgemein" })
    } catch {
      setError("Die Komponente konnte nicht erstellt werden.")
      return
    }
    setInput({ projectId: initialProjectId || projects[0]?.id || "", name: "", description: "", platform: "", releaseState: "Frei", ownerUserId: "" })
    setError("")
    onClose()
    navigate(`/components/${appPart.id}`)
  }

  return <Modal open={open} onClose={onClose} title="Komponente erstellen" description="Lege einen dauerhaft sichtbaren Bereich deines Projekts an."><form className="form-stack" onSubmit={submit}><div className="field-group"><label htmlFor="app-part-project">Projekt</label><AppSelect id="app-part-project" value={input.projectId} onValueChange={(projectId) => setInput({ ...input, projectId, ownerUserId: "" })} options={projects.map((item) => ({ value: item.id, label: item.name, description: item.type }))} /></div><div className="field-group"><label htmlFor="app-part-name">Name</label><input id="app-part-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} placeholder="Zum Beispiel Onboarding oder Image Pipeline" autoFocus />{error && <span className="field-error" role="alert">{error}</span>}</div><div className="field-group"><label htmlFor="app-part-description">Beschreibung</label><textarea id="app-part-description" value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} rows={3} placeholder="Welche Verantwortung hat diese Komponente?" /></div><div className="form-grid"><div className="field-group"><label htmlFor="app-part-platform">Bereich oder Plattform</label><input id="app-part-platform" value={input.platform} onChange={(event) => setInput({ ...input, platform: event.target.value })} placeholder={project?.platforms.join(", ") || "iOS"} /></div><div className="field-group"><label htmlFor="app-part-state">Technischer Zustand</label><AppSelect id="app-part-state" value={input.releaseState} onValueChange={(releaseState) => setInput({ ...input, releaseState: releaseState as ReleaseState })} options={releaseStates.map((state) => ({ value: state, label: state }))} /></div></div><div className="field-group"><label htmlFor="app-part-owner">Verantwortliche Person</label><AppSelect id="app-part-owner" value={input.ownerUserId || "unassigned"} onValueChange={(ownerUserId) => setInput({ ...input, ownerUserId: ownerUserId === "unassigned" ? "" : ownerUserId })} options={[{ value: "unassigned", label: "Noch frei" }, { value: currentUserId, label: "Ich übernehme" }, ...availableUsers.filter((user) => user.id !== currentUserId).map((user) => ({ value: user.id, label: user.name, description: user.jobTitle }))]} /><p className="field-helper">Eine freie Komponente kann später von einem Teammitglied beansprucht werden.</p></div><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit">Komponente erstellen</button></div></form></Modal>
}
