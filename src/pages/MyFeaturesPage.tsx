import { ListChecks, MagnifyingGlass, Plus } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { FeatureRow } from "../components/features/FeatureRow"
import { CreateFeatureModal } from "../components/forms/CreateFeatureModal"
import { AppSelect } from "../components/ui/AppSelect"
import type { FeatureStatus, Priority } from "../domain/types"
import { featureStatuses, priorities, useWorkspace } from "../state/WorkspaceContext"

export function MyFeaturesPage() {
  const { features, users, projects, currentUserId } = useWorkspace()
  const [query, setQuery] = useState("")
  const [projectId, setProjectId] = useState("all")
  const [status, setStatus] = useState<FeatureStatus | "Alle">("Alle")
  const [priority, setPriority] = useState<Priority | "Alle">("Alle")
  const [createOpen, setCreateOpen] = useState(false)
  const involvedProjects = useMemo(() => projects.filter((project) => project.memberIds.includes(currentUserId)), [projects, currentUserId])
  const involvedProjectIds = useMemo(() => new Set(involvedProjects.map((project) => project.id)), [involvedProjects])
  const normalizedQuery = query.trim().toLocaleLowerCase("de")
  const visibleFeatures = useMemo(() => features
    .filter((feature) => involvedProjectIds.has(feature.projectId))
    .filter((feature) => projectId === "all" || feature.projectId === projectId)
    .filter((feature) => status === "Alle" || feature.status === status)
    .filter((feature) => priority === "Alle" || feature.priority === priority)
    .filter((feature) => !normalizedQuery || `${feature.key} ${feature.title} ${feature.description}`.toLocaleLowerCase("de").includes(normalizedQuery)), [features, involvedProjectIds, normalizedQuery, priority, projectId, status])

  return (
    <div className="page tasks-page">
      <div className="page-header"><div><h1>Aufgaben</h1></div><button className="button primary" type="button" onClick={() => setCreateOpen(true)} disabled={!involvedProjects.length}><Plus size={16} weight="bold" />Aufgabe hinzufügen</button></div>
      <section className="tasks-toolbar" aria-label="Aufgaben filtern">
        <label className="tasks-toolbar-search" htmlFor="task-search"><MagnifyingGlass size={17} /><span className="visually-hidden">Aufgaben suchen</span><input id="task-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Aufgabe suchen" /></label>
        <AppSelect value={projectId} onValueChange={setProjectId} ariaLabel="Projekt filtern" options={[{ value: "all", label: "Alle Projekte" }, ...involvedProjects.map((project) => ({ value: project.id, label: project.name }))]} />
        <AppSelect value={status} onValueChange={(value) => setStatus(value as FeatureStatus | "Alle")} ariaLabel="Status filtern" options={[{ value: "Alle", label: "Alle Status" }, ...featureStatuses.map((value) => ({ value, label: value }))]} />
        <AppSelect value={priority} onValueChange={(value) => setPriority(value as Priority | "Alle")} ariaLabel="Priorität filtern" options={[{ value: "Alle", label: "Alle Prioritäten" }, ...priorities.map((value) => ({ value, label: value }))]} />
        <span className="tasks-result-count" aria-live="polite">{visibleFeatures.length} Aufgaben</span>
      </section>
      {visibleFeatures.length ? <section className="feature-list">{visibleFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} users={users} showProject />)}</section> : <div className="empty-state large-empty"><ListChecks size={30} /><strong>Keine passenden Aufgaben</strong><button className="button secondary" type="button" onClick={() => { setQuery(""); setProjectId("all"); setStatus("Alle"); setPriority("Alle") }}>Filter zurücksetzen</button></div>}
      <CreateFeatureModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
