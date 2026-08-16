import { ArrowRight, Plus, ShieldCheck, UserPlus } from "@phosphor-icons/react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { Modal } from "../components/ui/Modal"
import type { UserInput, UserRole } from "../domain/types"
import { useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"
import { relativeDate } from "../utils/format"

const roles: UserRole[] = ["Eigentümer", "Administrator", "Mitglied", "Gast"]
const inviteRoles: UserRole[] = ["Administrator", "Mitglied", "Gast"]

export function TeamPage() {
  const { users, projects, features, appParts, updateUserRole, inviteUser } = useWorkspace()
  const { showToast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)

  const changeRole = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role)
      showToast("Rolle aktualisiert")
    } catch {
      showToast("Rolle konnte nicht gespeichert werden", "info")
    }
  }

  return (
    <div className="page">
      <div className="page-header"><div><h1>Team und Rollen</h1><p>Verwalte Zugriff, Verantwortlichkeiten und die aktuelle Arbeit deines Teams.</p></div><div className="header-actions"><button className="button primary" type="button" onClick={() => setInviteOpen(true)}><UserPlus size={16} />Person einladen</button></div></div>
      <div className="role-summary">
        <div><ShieldCheck size={18} /><span><strong>Eigentümer</strong><small>Vollständige Kontrolle über Workspace und Abrechnung</small></span></div>
        <div><ShieldCheck size={18} /><span><strong>Administrator</strong><small>Verwaltet Projekte, Personen und Einstellungen</small></span></div>
        <div><ShieldCheck size={18} /><span><strong>Mitglied</strong><small>Erstellt Features und arbeitet an App Teilen</small></span></div>
        <div><ShieldCheck size={18} /><span><strong>Gast</strong><small>Sieht ausschließlich zugewiesene Projekte</small></span></div>
      </div>
      <section className="team-list">
        <div className="team-list-header"><span>Person</span><span>Rolle</span><span>Aktive App Teile</span><span>Projekte</span><span>Zuletzt aktiv</span><span /></div>
        {users.map((user) => {
          const userFeatures = features.filter((feature) => feature.members.some((member) => member.userId === user.id))
          const activeAppParts = appParts.filter((appPart) => appPart.activeUserIds.includes(user.id))
          const userProjects = projects.filter((project) => project.memberIds.includes(user.id))
          return (
            <article key={user.id} className="team-row expanded">
              <Avatar user={user} size="large" />
              <div className="team-person"><strong>{user.name}</strong><span>{user.jobTitle || `@${user.handle}`}</span></div>
              <select className="role-select" value={user.role} onChange={(event) => changeRole(user.id, event.target.value as UserRole)} aria-label={`Rolle für ${user.name}`}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
              <div className="team-stat"><strong>{activeAppParts.length}</strong><span>{userFeatures.length} Features</span></div>
              <div className="team-stat"><strong>{userProjects.length}</strong><span>Projekte</span></div>
              <div className="team-stat"><strong>{relativeDate(user.lastActiveAt)}</strong><span>{user.email}</span></div>
              <div className="team-feature-links">{activeAppParts.slice(0, 2).map((appPart) => <Link key={appPart.id} to={`/product/app-parts/${appPart.id}`}>{appPart.key}</Link>)}</div>
              <ArrowRight size={16} />
            </article>
          )
        })}
      </section>
      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={async (input) => { await inviteUser(input); showToast("Einladung wurde gesendet") }} />
    </div>
  )
}

function InviteMemberModal({ open, onClose, onInvite }: { open: boolean; onClose(): void; onInvite(input: UserInput): Promise<void> }) {
  const [input, setInput] = useState<UserInput>({ name: "", email: "", role: "Mitglied", jobTitle: "" })
  const [error, setError] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!input.name.trim() || !input.email.includes("@")) return setError("Name und gültige E Mail Adresse sind erforderlich.")
    setSubmitting(true)
    try {
      await onInvite(input)
    } catch {
      setSubmitting(false)
      return setError("Die Einladung konnte nicht gesendet werden.")
    }
    setSubmitting(false)
    setInput({ name: "", email: "", role: "Mitglied", jobTitle: "" })
    setError("")
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Person einladen" description="Füge eine Person hinzu und lege ihre Rolle fest.">
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid"><div className="field-group"><label htmlFor="invite-name">Name</label><input id="invite-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus /></div><div className="field-group"><label htmlFor="invite-role">Rolle</label><select id="invite-role" value={input.role} onChange={(event) => setInput({ ...input, role: event.target.value as UserRole })}>{inviteRoles.map((role) => <option key={role}>{role}</option>)}</select></div></div>
        <div className="field-group"><label htmlFor="invite-email">E Mail Adresse</label><input id="invite-email" type="email" value={input.email} onChange={(event) => setInput({ ...input, email: event.target.value })} /></div>
        <div className="field-group"><label htmlFor="invite-job">Rolle im Team</label><input id="invite-job" value={input.jobTitle} onChange={(event) => setInput({ ...input, jobTitle: event.target.value })} placeholder="Zum Beispiel iOS Entwicklung" /></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit" disabled={submitting}><Plus size={16} />{submitting ? "Einladung wird gesendet" : "Einladung senden"}</button></div>
      </form>
    </Modal>
  )
}
