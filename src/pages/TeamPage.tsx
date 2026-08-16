import { Briefcase, Check, Cube, DotsThree, ListChecks, MagnifyingGlass, Plus, ShieldCheck, UserPlus, UsersThree } from "@phosphor-icons/react"
import { useMemo, useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { Modal } from "../components/ui/Modal"
import { assignableRoles, canManageMember, invitableRoles, organizationPermissions, organizationRoles, roleDescriptions, roleLabels } from "../domain/permissions"
import type { JoinCodeRole, UserInput, UserRole } from "../domain/types"
import { useWorkspace } from "../state/WorkspaceContext"
import { useToast } from "../state/ToastContext"
import { relativeDate } from "../utils/format"

export function TeamPage() {
  const { users, projects, features, appParts, currentUserId, settings, updateUserRole, removeUser, inviteUser } = useWorkspace()
  const { showToast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const permissions = organizationPermissions(currentUser.role, settings)
  const inviteRoles = invitableRoles(currentUser.role)

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de")
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesQuery = !normalizedQuery || `${user.name} ${user.email} ${user.jobTitle} ${user.handle}`.toLocaleLowerCase("de").includes(normalizedQuery)
      return matchesRole && matchesQuery
    })
  }, [query, roleFilter, users])

  if (!permissions.canViewTeam) return <Navigate to="/dashboard" replace />

  const changeRole = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role)
      showToast("Rolle aktualisiert")
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Rolle konnte nicht gespeichert werden", "info")
    }
  }

  const removeMember = async (userId: string, name: string) => {
    if (!window.confirm(`${name} wirklich aus der Organisation entfernen?`)) return
    try {
      await removeUser(userId)
      showToast("Person entfernt")
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Person konnte nicht entfernt werden", "info")
    }
  }

  const usersWithActiveComponents = users.filter((user) => appParts.some((part) => part.activeUserIds.includes(user.id))).length
  const administrativeUsers = users.filter((user) => user.role === "owner" || user.role === "admin").length

  return (
    <div className="page team-page">
      <div className="page-header team-page-header">
        <div><span className="page-eyebrow">Organisation</span><h1>Team</h1><p>Personen, Zugriffsrechte und aktuelle Verantwortlichkeiten an einem Ort.</p></div>
        {permissions.canInvitePeople && <button className="button primary" type="button" onClick={() => setInviteOpen(true)}><UserPlus size={16} />Person einladen</button>}
      </div>

      <section className="team-overview" aria-label="Teamübersicht">
        <div><span className="team-overview-icon"><UsersThree size={17} /></span><span><strong>{users.length}</strong><small>Personen</small></span></div>
        <div><span className="team-overview-icon"><Cube size={17} /></span><span><strong>{usersWithActiveComponents}</strong><small>Arbeiten an Komponenten</small></span></div>
        <div><span className="team-overview-icon"><ShieldCheck size={17} /></span><span><strong>{administrativeUsers}</strong><small>Mit Verwaltung</small></span></div>
        <div className="team-current-access"><span><small>Dein Zugriff</small><strong>{roleLabels[currentUser.role]}</strong></span><span className="role-pill" data-role={currentUser.role}>{roleLabels[currentUser.role]}</span></div>
      </section>

      <section className="team-role-guide">
        <div className="team-section-heading"><div><h2>Rollenmodell</h2><p>Jede Rolle erweitert den Zugriff gezielt, ohne Verantwortlichkeiten innerhalb einer Aufgabe zu verändern.</p></div></div>
        <div className="team-role-grid">
          {organizationRoles.map((role) => {
            const count = users.filter((user) => user.role === role).length
            return <article key={role} className="team-role-card" data-role={role}><div><span className="role-marker" /><strong>{roleLabels[role]}</strong><span>{count}</span></div><p>{roleDescriptions[role]}</p></article>
          })}
        </div>
      </section>

      <section className="team-directory">
        <div className="team-directory-heading">
          <div><h2>Mitglieder</h2><span>{visibleUsers.length} von {users.length}</span></div>
          <div className="team-directory-tools">
            <label className="team-search"><MagnifyingGlass size={15} /><span className="visually-hidden">Personen suchen</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name oder E Mail Adresse" /></label>
            <label className="team-role-filter"><span className="visually-hidden">Nach Rolle filtern</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")}><option value="all">Alle Rollen</option>{organizationRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
          </div>
        </div>

        <div className="team-table-head"><span>Person</span><span>Rolle</span><span>Aktuelle Arbeit</span><span>Projekte</span><span>Aktivität</span><span /></div>
        <div className="team-member-list">
          {visibleUsers.map((user) => {
            const userFeatures = features.filter((feature) => feature.members.some((member) => member.userId === user.id))
            const activeAppParts = appParts.filter((appPart) => appPart.activeUserIds.includes(user.id))
            const userProjects = projects.filter((project) => project.memberIds.includes(user.id))
            const manageable = user.id !== currentUserId && canManageMember(currentUser.role, user.role)
            return (
              <article key={user.id} className="team-member-row">
                <div className="team-member-identity"><Avatar user={user} size="large" /><span><strong>{user.name}{user.id === currentUserId && <small>Du</small>}</strong><small>{user.jobTitle || `@${user.handle}`}</small></span></div>
                <div className="team-member-role">
                  {manageable ? <label className="role-select-shell" data-role={user.role}><span className="role-marker" /><select value={user.role} onChange={(event) => void changeRole(user.id, event.target.value as UserRole)} aria-label={`Rolle für ${user.name}`}>{assignableRoles(currentUser.role).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label> : <span className="role-pill" data-role={user.role}>{roleLabels[user.role]}</span>}
                </div>
                <div className="team-member-work">
                  <span><ListChecks size={14} /><strong>{userFeatures.length}</strong> Aufgaben</span>
                  {activeAppParts.length ? <div>{activeAppParts.slice(0, 2).map((part) => <Link key={part.id} to={`/components/${part.id}`}>{part.key}</Link>)}{activeAppParts.length > 2 && <span>und {activeAppParts.length - 2} weitere</span>}</div> : <small>Keine aktive Komponente</small>}
                </div>
                <div className="team-member-projects"><span><Briefcase size={14} /><strong>{userProjects.length}</strong></span><div>{userProjects.slice(0, 3).map((project) => <span key={project.id} className="project-glyph" style={{ background: project.color }}>{project.icon}</span>)}</div></div>
                <div className="team-member-activity"><strong>{relativeDate(user.lastActiveAt)}</strong><span>{user.email}</span></div>
                <div className="team-member-actions">
                  {manageable ? <details><summary aria-label={`Aktionen für ${user.name}`}><DotsThree size={18} weight="bold" /></summary><div><span>{roleLabels[user.role]}</span><button type="button" onClick={() => void removeMember(user.id, user.name)}>Aus Organisation entfernen</button></div></details> : <span className="team-actions-placeholder" />}
                </div>
              </article>
            )
          })}
          {!visibleUsers.length && <div className="team-empty"><MagnifyingGlass size={22} /><strong>Keine Personen gefunden</strong><span>Ändere die Suche oder den Rollenfilter.</span><button type="button" onClick={() => { setQuery(""); setRoleFilter("all") }}>Filter zurücksetzen</button></div>}
        </div>
      </section>

      <InviteMemberModal open={inviteOpen} roles={inviteRoles} onClose={() => setInviteOpen(false)} onInvite={async (input) => { await inviteUser(input); showToast("Einladung wurde gesendet") }} />
    </div>
  )
}

function InviteMemberModal({ open, roles, onClose, onInvite }: { open: boolean; roles: JoinCodeRole[]; onClose(): void; onInvite(input: UserInput): Promise<void> }) {
  const [input, setInput] = useState<UserInput>({ firstName: "", lastName: "", email: "", role: roles[0] ?? "member", jobTitle: "" })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!input.firstName.trim() || !input.lastName.trim() || !input.email.includes("@")) return setError("Vorname, Nachname und eine gültige E Mail Adresse sind erforderlich.")
    setSubmitting(true)
    setError("")
    try {
      await onInvite(input)
      setInput({ firstName: "", lastName: "", email: "", role: roles[0] ?? "member", jobTitle: "" })
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Die Einladung konnte nicht gesendet werden.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Person einladen" description="Füge eine Person hinzu und lege ihren Organisationszugriff fest.">
      <form className="form-stack team-invite-form" onSubmit={submit}>
        <div className="field-group"><label htmlFor="invite-email">E Mail Adresse</label><input id="invite-email" type="email" value={input.email} onChange={(event) => setInput({ ...input, email: event.target.value })} placeholder="name@unternehmen.de" autoFocus /></div>
        <div className="form-grid"><div className="field-group"><label htmlFor="invite-first-name">Vorname</label><input id="invite-first-name" value={input.firstName} onChange={(event) => setInput({ ...input, firstName: event.target.value })} /></div><div className="field-group"><label htmlFor="invite-last-name">Nachname</label><input id="invite-last-name" value={input.lastName} onChange={(event) => setInput({ ...input, lastName: event.target.value })} /></div></div>
        <div className="field-group"><label htmlFor="invite-job">Rolle im Team</label><input id="invite-job" value={input.jobTitle} onChange={(event) => setInput({ ...input, jobTitle: event.target.value })} placeholder="Zum Beispiel iOS Entwicklung" /></div>
        <fieldset className="invite-role-field"><legend>Organisationsrolle</legend><div>{roles.map((role) => <label key={role} className={input.role === role ? "selected" : ""} data-role={role}><input type="radio" name="invite-role" value={role} checked={input.role === role} onChange={() => setInput({ ...input, role })} /><span className="role-marker" /><span><strong>{roleLabels[role]}</strong><small>{roleDescriptions[role]}</small></span><Check size={15} weight="bold" /></label>)}</div></fieldset>
        <p className="team-invite-note"><ShieldCheck size={15} />Die Rolle kann später nur von einer dafür berechtigten Person geändert werden.</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit" disabled={submitting}><Plus size={16} />{submitting ? "Einladung wird gesendet" : "Einladung senden"}</button></div>
      </form>
    </Modal>
  )
}
