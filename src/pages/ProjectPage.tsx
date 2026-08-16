import { Funnel, GearSix, GridFour, List, Plus, SortAscending } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CreateFeatureModal } from "../components/forms/CreateFeatureModal"
import { CreateAppPartModal } from "../components/forms/CreateAppPartModal"
import { FeatureRow } from "../components/features/FeatureRow"
import { AvatarGroup } from "../components/ui/Avatar"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { FeatureStatus } from "../domain/types"
import { canContributeToProject, organizationPermissions } from "../domain/permissions"
import { featureStatuses, useWorkspace } from "../state/WorkspaceContext"

export function ProjectPage() {
  const { projectId } = useParams()
  const { projects, features, appParts, users, currentUserId, settings } = useWorkspace()
  const project = projects.find((item) => item.id === projectId)
  const [createOpen, setCreateOpen] = useState(false)
  const [createAppPartOpen, setCreateAppPartOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | "Alle">("Alle")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "board">("list")
  const [alphabetical, setAlphabetical] = useState(false)

  const projectFeatures = useMemo(() => features
    .filter((feature) => feature.projectId === projectId)
    .filter((feature) => statusFilter === "Alle" || feature.status === statusFilter)
    .filter((feature) => feature.title.toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de")))
    .sort((a, b) => alphabetical ? a.title.localeCompare(b.title, "de") : a.createdAt.localeCompare(b.createdAt)), [alphabetical, features, projectId, query, statusFilter])

  if (!project) return <div className="page"><div className="empty-state"><strong>Projekt nicht gefunden</strong></div></div>

  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const permissions = organizationPermissions(currentUser.role, settings)
  const canContribute = canContributeToProject(currentUser.role, project, currentUserId)
  const projectUsers = users.filter((user) => project.memberIds.includes(user.id))
  const statusGroups = featureStatuses.filter((status) => projectFeatures.some((feature) => feature.status === status))

  return (
    <div className="page project-page">
      <div className="project-hero">
        <div className="project-title-row">
          <span className="project-icon-large" style={{ background: project.color }}>{project.icon}</span>
          <div><span className="project-context">{project.type}</span><h1>{project.name}</h1></div>
        </div>
        <div className="project-hero-actions">
          <AvatarGroup users={projectUsers} />
          <StatusBadge value={project.status} />
          {permissions.canManageOrganization && <Link className="button secondary" to={`/projects/${project.id}/settings`}><GearSix size={16} />Einstellungen</Link>}
          {permissions.canCreateComponents && <button className="button secondary" type="button" onClick={() => setCreateAppPartOpen(true)}><Plus size={16} />Komponente</button>}
          {canContribute && <button className="button primary" type="button" onClick={() => setCreateOpen(true)}><Plus size={16} weight="bold" />Aufgabe erstellen</button>}
        </div>
      </div>
      <p className="project-description">{project.description}</p>
      <div className="project-meta-strip">
        <span><strong>{features.filter((feature) => feature.projectId === project.id).length}</strong> Aufgaben</span>
        <Link to="/components"><strong>{appParts.filter((appPart) => appPart.projectId === project.id).length}</strong> Komponenten</Link>
        <span><strong>{projectUsers.length}</strong> Mitglieder</span>
        <span><strong>{project.platforms.join(", ")}</strong> Plattformen</span>
      </div>

      <div className="feature-toolbar">
        <div className="segmented-control" aria-label="Ansicht wählen">
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="Listenansicht"><List size={16} /></button>
          <button type="button" className={view === "board" ? "active" : ""} onClick={() => setView("board")} aria-label="Board Ansicht"><GridFour size={16} /></button>
        </div>
        <div className="toolbar-filter">
          <Funnel size={15} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FeatureStatus | "Alle")} aria-label="Nach Status filtern">
            <option>Alle</option>
            {featureStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="toolbar-search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Aufgaben suchen" aria-label="Aufgaben suchen" />
        </div>
        <button className={alphabetical ? "toolbar-icon active" : "toolbar-icon"} type="button" aria-pressed={alphabetical} onClick={() => setAlphabetical((value) => !value)}><SortAscending size={16} />Alphabetisch</button>
      </div>

      {projectFeatures.length ? (
        view === "list" ? (
          <section className="feature-list" aria-label="Aufgaben">
            {projectFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} users={users} />)}
          </section>
        ) : (
          <section className="feature-board" aria-label="Aufgaben Board">
            {statusGroups.map((status) => (
              <div className="board-column" key={status}>
                <div className="board-column-heading"><StatusBadge value={status} /><span>{projectFeatures.filter((feature) => feature.status === status).length}</span></div>
                {projectFeatures.filter((feature) => feature.status === status).map((feature) => <FeatureRow key={feature.id} feature={feature} users={users} />)}
              </div>
            ))}
          </section>
        )
      ) : (
        <div className="empty-state large-empty"><GridFour size={30} /><strong>Keine Aufgaben gefunden</strong><span>Ändere den Filter oder erstelle eine neue Aufgabe.</span>{canContribute && <button className="button primary" type="button" onClick={() => setCreateOpen(true)}>Aufgabe erstellen</button>}</div>
      )}

      <CreateFeatureModal open={createOpen} onClose={() => setCreateOpen(false)} project={project} />
      <CreateAppPartModal open={createAppPartOpen} onClose={() => setCreateAppPartOpen(false)} initialProjectId={project.id} />
    </div>
  )
}
