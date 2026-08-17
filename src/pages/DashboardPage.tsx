import { ArrowRight, CalendarBlank, CheckCircle, Plus, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { useWorkspace } from "../state/WorkspaceContext"
import { featureProgress, relativeDate } from "../utils/format"
import { ProgressRing } from "../components/ui/ProgressRing"
import { StatusBadge } from "../components/ui/StatusBadge"
import { organizationPermissions } from "../domain/permissions"

export function DashboardPage({ onCreateProject }: { onCreateProject(): void }) {
  const { users, projects, features, currentUserId, settings } = useWorkspace()
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const permissions = organizationPermissions(currentUser.role, settings)
  const involvedProjectIds = new Set(projects.filter((project) => project.memberIds.includes(currentUserId)).map((project) => project.id))
  const myFeatures = features.filter((feature) => involvedProjectIds.has(feature.projectId) && feature.status !== "Fertig")
  const urgentFeatures = features.filter((feature) => feature.priority === "Dringend" || feature.status === "Blockiert")
  const updates = features.flatMap((feature) => feature.updates.map((update) => ({ feature, update }))).sort((a, b) => b.update.createdAt.localeCompare(a.update.createdAt)).slice(0, 4)

  return (
    <div className="page dashboard-page">
      <div className="page-header dashboard-heading">
        <div>
          <p className="quiet-label">Sonntag, 16. August</p>
          <h1>Guten Morgen, {currentUser.name.split(" ")[0]}</h1>
          <p>Hier ist der aktuelle Stand deiner Projekte und Aufgaben.</p>
        </div>
        {permissions.canCreateProjects && <button className="button primary" type="button" onClick={onCreateProject}><Plus size={16} weight="bold" />Projekt erstellen</button>}
      </div>

      <section className="dashboard-summary" aria-label="Zusammenfassung">
        <div><strong>{myFeatures.length}</strong><span>Aktive Aufgaben</span></div>
        <div><strong>{urgentFeatures.length}</strong><span>Benötigen Aufmerksamkeit</span></div>
        <div><strong>{projects.filter((project) => project.status === "Aktiv").length}</strong><span>Aktive Projekte</span></div>
        <div><strong>{features.filter((feature) => feature.status === "Im Review").length}</strong><span>Im Review</span></div>
      </section>

      <div className="dashboard-grid">
        <section className="panel my-work-panel">
          <div className="panel-heading">
            <div><h2>Aufgaben</h2><span>{myFeatures.length} aktiv</span></div>
            <Link to="/tasks">Alle anzeigen <ArrowRight size={15} /></Link>
          </div>
          <div className="compact-feature-list">
            {myFeatures.slice(0, 5).map((feature) => {
              const project = projects.find((item) => item.id === feature.projectId)
              return (
                <Link key={feature.id} to={`/projects/${feature.projectId}/tasks/${feature.id}`} className="compact-feature">
                  <span className="project-glyph" style={{ background: project?.color }}>{project?.icon}</span>
                  <div>
                    <strong>{feature.title}</strong>
                    <span>{project?.name} <span className="inline-separator">/</span> {feature.key}</span>
                  </div>
                  <StatusBadge value={feature.status} />
                  <ProgressRing value={featureProgress(feature)} size={34} />
                </Link>
              )
            })}
          </div>
        </section>

        <section className="panel attention-panel">
          <div className="panel-heading"><div><h2>Aufmerksamkeit</h2><span>Aktuelle Risiken</span></div></div>
          <div className="attention-list">
            {urgentFeatures.map((feature) => (
              <Link key={feature.id} to={`/projects/${feature.projectId}/tasks/${feature.id}`} className="attention-item">
                <span className="attention-symbol"><Warning size={17} weight="fill" /></span>
                <div><strong>{feature.title}</strong><span>{feature.status === "Blockiert" ? "Aufgabe ist blockiert" : "Dringende Priorität"}</span></div>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="panel activity-panel">
        <div className="panel-heading"><div><h2>Letzte Updates</h2><span>Aus allen Projekten</span></div></div>
        <div className="activity-list">
          {updates.map(({ feature, update }) => {
            const author = users.find((user) => user.id === update.authorId)
            return (
              <Link key={update.id} to={`/projects/${feature.projectId}/tasks/${feature.id}`} className="activity-item">
                <span className="activity-icon"><CheckCircle size={18} /></span>
                <div><strong>{feature.title}</strong><p>{update.message}</p><span>{author?.name} <span className="inline-separator">/</span> {relativeDate(update.createdAt)}</span></div>
                <StatusBadge value={update.health} />
              </Link>
            )
          })}
          {!updates.length && <div className="empty-state"><CalendarBlank size={26} /><strong>Noch keine Updates</strong><span>Updates aus Aufgaben erscheinen hier.</span></div>}
        </div>
      </section>
    </div>
  )
}
