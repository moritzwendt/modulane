import { ListChecks } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { FeatureRow } from "../components/features/FeatureRow"
import type { FeatureStatus } from "../domain/types"
import { featureStatuses, useWorkspace } from "../state/WorkspaceContext"

export function MyFeaturesPage() {
  const { features, users, currentUserId } = useWorkspace()
  const [status, setStatus] = useState<FeatureStatus | "Offen" | "Alle">("Offen")
  const myFeatures = useMemo(() => features
    .filter((feature) => feature.members.some((member) => member.userId === currentUserId))
    .filter((feature) => status === "Alle" || status === "Offen" && feature.status !== "Fertig" || feature.status === status), [features, currentUserId, status])

  return (
    <div className="page">
      <div className="page-header"><div><h1>Meine Features</h1><p>Alles, woran du beteiligt bist oder ein Review übernimmst.</p></div></div>
      <div className="tab-row" role="tablist" aria-label="Status der Features">
        {(["Offen", "Alle", ...featureStatuses] as const).map((item) => (
          <button key={item} type="button" className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>
        ))}
      </div>
      {myFeatures.length ? <section className="feature-list">{myFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} users={users} />)}</section> : <div className="empty-state large-empty"><ListChecks size={30} /><strong>Keine Features in dieser Ansicht</strong><span>Wechsle den Filter, um weitere Features zu sehen.</span></div>}
    </div>
  )
}
