import { ArrowRight, Plus } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { AvatarGroup } from "../components/ui/Avatar"
import { StatusBadge } from "../components/ui/StatusBadge"
import { useWorkspace } from "../state/WorkspaceContext"

export function ProjectsPage({ onCreateProject }: { onCreateProject(): void }) {
  const { projects, features, users } = useWorkspace()

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Projekte</h1><p>Apps, Dienste und große Softwareprodukte an einem Ort.</p></div>
        <button className="button primary" type="button" onClick={onCreateProject}><Plus size={16} weight="bold" />Projekt erstellen</button>
      </div>
      <div className="project-grid">
        {projects.map((project) => {
          const projectFeatures = features.filter((feature) => feature.projectId === project.id)
          const projectUsers = users.filter((user) => project.memberIds.includes(user.id))
          const completed = projectFeatures.filter((feature) => feature.status === "Fertig").length
          return (
            <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
              <div className="project-card-top">
                <span className="project-icon-large" style={{ background: project.color }}>{project.icon}</span>
                <StatusBadge value={project.status} />
              </div>
              <div className="project-card-copy">
                <h2>{project.name}</h2>
                <p>{project.description}</p>
              </div>
              <div className="project-platforms">
                <span>{project.type}</span>
                {project.platforms.map((platform) => <span key={platform}>{platform}</span>)}
              </div>
              <div className="project-card-footer">
                <div><strong>{projectFeatures.length}</strong><span>Features</span></div>
                <div><strong>{completed}</strong><span>Fertig</span></div>
                <AvatarGroup users={projectUsers} />
                <ArrowRight size={16} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
