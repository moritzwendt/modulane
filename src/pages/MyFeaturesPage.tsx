import { CalendarBlank, ListChecks, Plus } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { FeatureRow } from "../components/features/FeatureRow"
import { CreateFeatureModal } from "../components/forms/CreateFeatureModal"
import type { FeatureStatus } from "../domain/types"
import { featureStatuses, useWorkspace } from "../state/WorkspaceContext"

export function MyFeaturesPage() {
  const { features, users, projects, currentUserId } = useWorkspace()
  const [status, setStatus] = useState<FeatureStatus | "Offen" | "Alle">("Offen")
  const [createOpen, setCreateOpen] = useState(false)
  const myFeatures = useMemo(() => features
    .filter((feature) => feature.members.some((member) => member.userId === currentUserId))
    .filter((feature) => status === "Alle" || status === "Offen" && feature.status !== "Fertig" || feature.status === status), [features, currentUserId, status])

  return (
    <div className="page">
      <div className="page-header"><div><h1>Meine Aufgaben</h1><p>Alles, woran du beteiligt bist oder ein Review übernimmst.</p></div><button className="button primary" type="button" onClick={() => setCreateOpen(true)} disabled={!projects.length}><Plus size={16} weight="bold" />Aufgabe hinzufügen</button></div>
      <section className="my-tasks-quickstart">
        <div className="quickstart-icon"><CalendarBlank size={20} /></div>
        <div><strong>Was möchtest du heute voranbringen?</strong><span>Erstelle eine Aufgabe, wähle das Projekt und verknüpfe direkt alle betroffenen Komponenten und Personen.</span></div>
        <button className="button secondary" type="button" onClick={() => setCreateOpen(true)} disabled={!projects.length}><Plus size={15} />Neue Aufgabe</button>
      </section>
      <div className="tab-row" role="tablist" aria-label="Status der Aufgaben">
        {(["Offen", "Alle", ...featureStatuses] as const).map((item) => (
          <button key={item} type="button" className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>
        ))}
      </div>
      {myFeatures.length ? <section className="feature-list">{myFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} users={users} />)}</section> : <div className="empty-state large-empty"><ListChecks size={30} /><strong>Keine Aufgaben in dieser Ansicht</strong><span>Wechsle den Filter oder lege deine nächste Aufgabe an.</span><button className="button secondary" type="button" onClick={() => setCreateOpen(true)} disabled={!projects.length}>Aufgabe hinzufügen</button></div>}
      <CreateFeatureModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
