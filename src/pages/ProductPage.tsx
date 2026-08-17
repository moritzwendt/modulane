import { ArrowRight, Cube, Plus, UserCirclePlus } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CreateAppPartModal } from "../components/forms/CreateAppPartModal"
import { AvatarGroup } from "../components/ui/Avatar"
import { AppSelect } from "../components/ui/AppSelect"
import { StatusBadge } from "../components/ui/StatusBadge"
import { organizationPermissions } from "../domain/permissions"
import { useWorkspace } from "../state/WorkspaceContext"

export function ProductPage() {
  const { projects, appParts, features, users, currentUserId, settings, claimAppPart } = useWorkspace()
  const [createOpen, setCreateOpen] = useState(false)
  const [projectFilter, setProjectFilter] = useState("Alle")
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const permissions = organizationPermissions(currentUser.role, settings)
  const visibleProjects = useMemo(() => projects.filter((project) => projectFilter === "Alle" || project.id === projectFilter), [projectFilter, projects])

  return (
    <div className="page product-page">
      <div className="page-header">
        <div><h1>Komponenten</h1><p>Alle dauerhaften Bereiche deiner Projekte, ihre Stabilität und die Personen, die gerade daran arbeiten.</p></div>
        {permissions.canCreateComponents && <button className="button primary" type="button" onClick={() => setCreateOpen(true)}><Plus size={16} weight="bold" />Komponente erstellen</button>}
      </div>
      <div className="product-overview">
        <div><strong>{appParts.length}</strong><span>Komponenten</span></div>
        <div><strong>{appParts.filter((appPart) => appPart.activeUserIds.length).length}</strong><span>In Bearbeitung</span></div>
        <div><strong>{appParts.filter((appPart) => appPart.releaseState === "Production Ready").length}</strong><span>Production Ready</span></div>
        <div><strong>{appParts.filter((appPart) => !appPart.ownerUserId).length}</strong><span>Frei</span></div>
      </div>
      <div className="product-filter">
        <label htmlFor="product-project-filter">Projekt</label>
        <AppSelect compact id="product-project-filter" value={projectFilter} onValueChange={setProjectFilter} options={[{ value: "Alle", label: "Alle Projekte" }, ...projects.map((project) => ({ value: project.id, label: project.name, description: project.type }))]} />
      </div>
      <div className="product-projects">
        {visibleProjects.map((project) => {
          const parts = appParts.filter((appPart) => appPart.projectId === project.id)
          return (
            <section className="product-project" key={project.id}>
              <div className="product-project-heading">
                <span className="project-icon-large" style={{ background: project.color }}>{project.icon}</span>
                <div><h2>{project.name}</h2><span>{project.type} <span className="inline-separator">/</span> {parts.length} Komponenten</span></div>
                <Link to={`/projects/${project.id}`}>Aufgaben ansehen <ArrowRight size={14} /></Link>
              </div>
              {parts.length ? (
                <div className="app-part-list">
                  {parts.map((appPart) => {
                    const activeUsers = users.filter((user) => appPart.activeUserIds.includes(user.id))
                    const linkedFeatures = features.filter((feature) => feature.appPartIds.includes(appPart.id))
                    const owner = users.find((user) => user.id === appPart.ownerUserId)
                    return (
                      <article className="app-part-row" key={appPart.id}>
                        <Link className="app-part-row-link" to={`/components/${appPart.id}`}>
                          <span className="app-part-symbol"><Cube size={17} /></span>
                          <div className="app-part-copy"><span>{appPart.key} <span className="inline-separator">/</span> {appPart.platform}</span><strong>{appPart.name}</strong><p>{appPart.description}</p></div>
                          <StatusBadge value={appPart.releaseState} />
                          <div className="app-part-feature-count"><strong>{linkedFeatures.length}</strong><span>{linkedFeatures.length === 1 ? "Aufgabe" : "Aufgaben"}</span></div>
                          <div className="app-part-people">{activeUsers.length ? <><AvatarGroup users={activeUsers} /><span>Arbeitet gerade</span></> : owner ? <><AvatarGroup users={[owner]} /><span>Verantwortlich</span></> : <span>Niemand aktiv</span>}</div>
                          <ArrowRight size={15} />
                        </Link>
                        {permissions.canCreateComponents && !appPart.ownerUserId && <button className="claim-inline" type="button" onClick={() => claimAppPart(appPart.id)}><UserCirclePlus size={15} />Beanspruchen</button>}
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state product-empty">
                  <Cube size={26} />
                  <strong>Noch keine Komponenten</strong>
                  <span>Lege die erste dauerhafte Komponente für dieses Projekt an.</span>
                  {permissions.canCreateComponents && <button className="button secondary" type="button" onClick={() => setCreateOpen(true)}>Komponente erstellen</button>}
                </div>
              )}
            </section>
          )
        })}
      </div>
      {permissions.canCreateComponents && <CreateAppPartModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
