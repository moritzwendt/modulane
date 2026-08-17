import { CalendarBlank, CaretRight, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import type { Feature, User } from "../../domain/types"
import { useWorkspace } from "../../state/WorkspaceContext"
import { featureProgress, formatDate } from "../../utils/format"
import { AvatarGroup } from "../ui/Avatar"
import { ProgressRing } from "../ui/ProgressRing"
import { StatusBadge } from "../ui/StatusBadge"

export function FeatureRow({ feature, users, showProject = false }: { feature: Feature; users: User[]; showProject?: boolean }) {
  const { appParts, projects, currentUserId } = useWorkspace()
  const members = users.filter((user) => feature.members.some((member) => member.userId === user.id))
  const linkedAppParts = appParts.filter((item) => feature.appPartIds.includes(item.id))
  const occupiedAppParts = linkedAppParts.filter((item) => item.activeUserIds.some((userId) => userId !== currentUserId))
  const project = projects.find((item) => item.id === feature.projectId)
  const occupiedTitle = occupiedAppParts.map((item) => {
    const names = users.filter((user) => item.activeUserIds.includes(user.id) && user.id !== currentUserId).map((user) => user.name)
    return `${item.name}: ${names.join(", ")}`
  }).join(". ")

  return (
    <Link className="feature-row" to={`/projects/${feature.projectId}/tasks/${feature.id}`}>
      <div className="feature-row-main">
        <span className="feature-key">{feature.key}</span>
        <div>
          {showProject && project && <span className="feature-project-context">{project.name}</span>}
          <strong>{feature.title}</strong>
          {feature.description && <p>{feature.description}</p>}
        </div>
      </div>
      <div className="feature-row-meta">
        {feature.health !== "Im Plan" && <span className="health-icon" title={feature.health}><Warning size={16} weight="fill" /></span>}
        {occupiedAppParts.length > 0 ? <span className="component-conflict" title={occupiedTitle}><Warning size={14} weight="fill" />{occupiedAppParts.length === 1 ? "Komponente belegt" : `${occupiedAppParts.length} Komponenten belegt`}</span> : linkedAppParts.length > 0 && <span className="linked-app-part">{linkedAppParts[0].name}{linkedAppParts.length > 1 ? ` +${linkedAppParts.length - 1}` : ""}</span>}
        <span className="work-status"><StatusBadge value={feature.status} /></span>
        <span className="priority-status"><StatusBadge value={feature.priority} /></span>
        <span className="date-meta"><CalendarBlank size={15} />{formatDate(feature.targetDate)}</span>
        <span className="assigned-work-group" title="Zugewiesen"><AvatarGroup users={members} limit={3} /></span>
        <ProgressRing value={featureProgress(feature)} />
        <CaretRight className="row-caret" size={16} />
      </div>
    </Link>
  )
}
