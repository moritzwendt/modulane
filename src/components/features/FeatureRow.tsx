import { CalendarBlank, CaretRight, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import type { Feature, User } from "../../domain/types"
import { featureProgress, formatDate } from "../../utils/format"
import { AvatarGroup } from "../ui/Avatar"
import { ProgressRing } from "../ui/ProgressRing"
import { StatusBadge } from "../ui/StatusBadge"

export function FeatureRow({ feature, users }: { feature: Feature; users: User[] }) {
  const members = users.filter((user) => feature.members.some((member) => member.userId === user.id))

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
        <StatusBadge value={feature.status} />
        <StatusBadge value={feature.priority} />
        <span className="date-meta"><CalendarBlank size={15} />{formatDate(feature.targetDate)}</span>
        <AvatarGroup users={members} limit={3} />
        <ProgressRing value={featureProgress(feature)} />
        <CaretRight className="row-caret" size={16} />
      </div>
    </Link>
  )
}
