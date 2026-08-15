import { ArrowCounterClockwise, ArrowRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Avatar } from "../components/ui/Avatar"
import { StatusBadge } from "../components/ui/StatusBadge"
import { useWorkspace } from "../state/WorkspaceContext"

export function TeamPage() {
  const { users, projects, features, resetDemo } = useWorkspace()
  return (
    <div className="page">
      <div className="page-header"><div><h1>Team</h1><p>Beispielmitglieder und ihre aktuelle Produktarbeit.</p></div><button className="button secondary" type="button" onClick={resetDemo}><ArrowCounterClockwise size={16} />Demodaten zurücksetzen</button></div>
      <section className="team-list">
        {users.map((user) => {
          const userFeatures = features.filter((feature) => feature.members.some((member) => member.userId === user.id))
          const userProjects = projects.filter((project) => project.memberIds.includes(user.id))
          return (
            <article key={user.id} className="team-row">
              <Avatar user={user} size="large" />
              <div className="team-person"><strong>{user.name}</strong><span>@{user.handle}</span></div>
              <StatusBadge value={user.role === "Mitglied" ? "Normal" : "Hoch"} />
              <div className="team-stat"><strong>{userFeatures.filter((feature) => feature.status !== "Fertig").length}</strong><span>Aktive Features</span></div>
              <div className="team-stat"><strong>{userProjects.length}</strong><span>Projekte</span></div>
              <div className="team-feature-links">{userFeatures.slice(0, 2).map((feature) => <Link key={feature.id} to={`/projects/${feature.projectId}/features/${feature.id}`}>{feature.key}</Link>)}</div>
              <ArrowRight size={16} />
            </article>
          )
        })}
      </section>
    </div>
  )
}
