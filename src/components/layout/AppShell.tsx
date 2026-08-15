import {
  Bell,
  CaretDown,
  CirclesFour,
  FolderSimple,
  House,
  ListChecks,
  MagnifyingGlass,
  Moon,
  Plus,
  SidebarSimple,
  Sun,
  Users,
  X,
} from "@phosphor-icons/react"
import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import { useWorkspace } from "../../state/WorkspaceContext"
import { Avatar } from "../ui/Avatar"
import { Modal } from "../ui/Modal"

const navigation = [
  { to: "/", label: "Übersicht", icon: House },
  { to: "/my-features", label: "Meine Features", icon: ListChecks },
  { to: "/projects", label: "Projekte", icon: FolderSimple },
  { to: "/team", label: "Team", icon: Users },
]

export function AppShell({ children, onCreateProject }: { children: ReactNode; onCreateProject(): void }) {
  const { projects, features, users, currentUserId, setCurrentUser } = useWorkspace()
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [theme, setTheme] = useState(() => window.localStorage.getItem("modulane.theme") ?? "light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem("modulane.theme", theme)
  }, [theme])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("de")
  const projectResults = normalizedQuery ? projects.filter((project) => `${project.name} ${project.description}`.toLocaleLowerCase("de").includes(normalizedQuery)) : projects
  const featureResults = normalizedQuery ? features.filter((feature) => `${feature.key} ${feature.title} ${feature.description}`.toLocaleLowerCase("de").includes(normalizedQuery)) : features.slice(0, 5)
  const recentNotifications = features.flatMap((feature) => feature.updates.map((update) => ({ feature, update }))).sort((a, b) => b.update.createdAt.localeCompare(a.update.createdAt)).slice(0, 3)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="workspace-switcher">
          <span className="brand-mark"><CirclesFour size={18} weight="fill" /></span>
          <div>
            <strong>Modulane</strong>
            <span>SDX Solutions</span>
          </div>
          <CaretDown size={14} />
        </div>

        <nav className="primary-nav" aria-label="Hauptnavigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Icon size={17} weight="regular" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section-heading">
          <span>Projekte</span>
          <button type="button" onClick={onCreateProject} aria-label="Projekt erstellen">
            <Plus size={15} />
          </button>
        </div>
        <nav className="project-nav" aria-label="Projekte">
          {projects.map((project) => (
            <NavLink key={project.id} to={`/projects/${project.id}`} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="project-glyph" style={{ background: project.color }}>{project.icon}</span>
              <span>{project.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <label className="user-switcher">
            <Avatar user={currentUser} size="small" />
            <span>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </span>
            <select value={currentUserId} onChange={(event) => setCurrentUser(event.target.value)} aria-label="Demo Benutzer wechseln">
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <CaretDown size={14} />
          </label>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Navigation schließen" onClick={() => setSidebarOpen(false)} />}

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Navigation öffnen">
            <SidebarSimple size={20} />
          </button>
          <button className="search-trigger" type="button" onClick={() => setSearchOpen(true)}>
            <MagnifyingGlass size={16} />
            <span>Suchen</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Dunkles Design aktivieren" : "Helles Design aktivieren"}>
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="icon-button" type="button" aria-label="Benachrichtigungen" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}>
              <Bell size={17} />
              <span className="notification-count">3</span>
            </button>
            <Avatar user={currentUser} size="small" />
            {notificationsOpen && (
              <div className="notification-popover">
                <div><strong>Benachrichtigungen</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Benachrichtigungen schließen"><X size={15} /></button></div>
                {recentNotifications.map(({ feature, update }) => (
                  <Link key={update.id} to={`/projects/${feature.projectId}/features/${feature.id}`} onClick={() => setNotificationsOpen(false)}>
                    <strong>{feature.title}</strong>
                    <span>{update.message}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>
        <main id="main-content" className="main-content">{children}</main>
      </div>
      <Modal open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery("") }} title="Suchen" description="Finde Projekte und Features im gesamten Workspace.">
        <div className="global-search">
          <div className="global-search-input"><MagnifyingGlass size={17} /><label className="visually-hidden" htmlFor="global-search-input">Suchbegriff</label><input id="global-search-input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Projekt oder Feature suchen" autoFocus /></div>
          <div className="search-results">
            {projectResults.length > 0 && <div className="search-group"><span>Projekte</span>{projectResults.slice(0, 4).map((project) => <Link key={project.id} to={`/projects/${project.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}><span className="project-glyph" style={{ background: project.color }}>{project.icon}</span><strong>{project.name}</strong><small>{project.type}</small></Link>)}</div>}
            {featureResults.length > 0 && <div className="search-group"><span>Features</span>{featureResults.slice(0, 7).map((feature) => <Link key={feature.id} to={`/projects/${feature.projectId}/features/${feature.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}><span className="feature-key">{feature.key}</span><strong>{feature.title}</strong><small>{feature.status}</small></Link>)}</div>}
            {!projectResults.length && !featureResults.length && <div className="empty-state"><MagnifyingGlass size={24} /><strong>Keine Ergebnisse</strong><span>Versuche einen anderen Suchbegriff.</span></div>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
