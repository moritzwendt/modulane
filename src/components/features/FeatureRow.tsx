import { CalendarBlank, CaretRight, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import type { Feature, User } from "../../domain/types"
import { useWorkspace } from "../../state/WorkspaceContext"
import { featureProgress, formatDate } from "../../utils/format"
import { AvatarGroup } from "../ui/Avatar"
import { ProgressRing } from "../ui/ProgressRing"
import { StatusBadge } from "../ui/StatusBadge"

export function FeatureRow({ feature, users }: { feature: Feature; users: User[] }) {
  const { appParts } = useWorkspace()
  const members = users.filter((user) => feature.members.some((member) => member.userId === user.id))
  const appPart = appParts.find((item) => item.id === feature.appPartId)

  return (
    <Link className="feature-row" to={`/projects/${feature.projectId}/features/${feature.id}`}>
      <div className="feature-row-main">
        <span className="feature-key">{feature.key}</span>
        <div>
          <strong>{feature.title}</strong>
          <p>{feature.description}</p>
        </div>
      </div>
      <div className="feature-row-meta">
        {feature.health !== "Im Plan" && <span className="health-icon" title={feature.health}><Warning size={16} weight="fill" /></span>}
        {appPart && <span className="linked-app-part">{appPart.name}</span>}
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
