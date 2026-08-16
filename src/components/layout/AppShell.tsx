import {
  Bell,
  CaretDown,
  Cube,
  FolderSimple,
  GearSix,
  House,
  ListChecks,
  MagnifyingGlass,
  Moon,
  Plus,
  SidebarSimple,
  SignOut,
  Sun,
  UserCircle,
  Users,
  X,
} from "@phosphor-icons/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../state/AuthContext"
import { useWorkspace } from "../../state/WorkspaceContext"
import { Avatar } from "../ui/Avatar"
import { BrandLogo } from "../ui/BrandLogo"
import { Modal } from "../ui/Modal"

const navigation = [
  { to: "/dashboard", label: "Übersicht", icon: House },
  { to: "/product", label: "Das Produkt", icon: Cube },
  { to: "/my-features", label: "Meine Features", icon: ListChecks },
  { to: "/projects", label: "Projekte", icon: FolderSimple },
  { to: "/team", label: "Team", icon: Users },
  { to: "/settings", label: "Einstellungen", icon: GearSix },
]

export function AppShell({ children, onCreateProject }: { children: ReactNode; onCreateProject(): void }) {
  const { projects, features, appParts, users, currentUserId, settings } = useWorkspace()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [theme, setTheme] = useState(() => window.localStorage.getItem("modulane.theme") ?? "light")
  const accountMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!accountMenuOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [accountMenuOpen])

  const signOut = async () => {
    setAccountMenuOpen(false)
    await logout()
    navigate("/login")
  }

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("de")
  const projectResults = normalizedQuery ? projects.filter((project) => `${project.name} ${project.description}`.toLocaleLowerCase("de").includes(normalizedQuery)) : projects
  const featureResults = normalizedQuery ? features.filter((feature) => `${feature.key} ${feature.title} ${feature.description}`.toLocaleLowerCase("de").includes(normalizedQuery)) : features.slice(0, 5)
  const appPartResults = normalizedQuery ? appParts.filter((appPart) => `${appPart.key} ${appPart.name} ${appPart.description}`.toLocaleLowerCase("de").includes(normalizedQuery)) : appParts.slice(0, 5)
  const recentNotifications = features.flatMap((feature) => feature.updates.map((update) => ({ feature, update }))).sort((a, b) => b.update.createdAt.localeCompare(a.update.createdAt)).slice(0, 3)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="workspace-switcher">
          <span className="brand-mark"><BrandLogo /></span>
          <div>
            <strong>Modulane</strong>
            <span>{settings.name}</span>
          </div>
          <CaretDown size={14} />
        </div>

        <nav className="primary-nav" aria-label="Hauptnavigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
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

        {currentUser && <div className="sidebar-footer">
          <div className="sidebar-user-summary">
            <Avatar user={currentUser} size="small" />
            <span>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </span>
          </div>
        </div>}
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
            <button className="icon-button" type="button" aria-label="Benachrichtigungen" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setAccountMenuOpen(false) }}>
              <Bell size={17} />
              {recentNotifications.length > 0 && <span className="notification-count">{recentNotifications.length}</span>}
            </button>
            {currentUser && <div className="account-menu-area" ref={accountMenuRef}>
              <button className="account-menu-trigger" type="button" aria-label="Benutzermenü öffnen" aria-expanded={accountMenuOpen} aria-haspopup="menu" onClick={() => { setAccountMenuOpen((value) => !value); setNotificationsOpen(false) }}><Avatar user={currentUser} size="small" /><CaretDown size={12} /></button>
              {accountMenuOpen && <div className="account-menu" role="menu">
                <div className="account-menu-identity"><Avatar user={currentUser} size="large" /><div><strong>{currentUser.name}</strong><span>{currentUser.email}</span><small>{currentUser.role} in {settings.name}</small></div></div>
                <nav aria-label="Benutzereinstellungen">
                  <Link to="/settings?tab=account" role="menuitem" onClick={() => setAccountMenuOpen(false)}><UserCircle size={17} /><span><strong>Mein Konto</strong><small>Profil und E Mail Adresse</small></span></Link>
                  <Link to="/settings?tab=notifications" role="menuitem" onClick={() => setAccountMenuOpen(false)}><Bell size={17} /><span><strong>Benachrichtigungen</strong><small>Persönliche Hinweise</small></span></Link>
                  <Link to="/settings?tab=workspace" role="menuitem" onClick={() => setAccountMenuOpen(false)}><GearSix size={17} /><span><strong>Workspace Einstellungen</strong><small>Organisation und Zugänge</small></span></Link>
                </nav>
                <div className="account-menu-actions">
                  <button type="button" role="menuitem" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === "light" ? "Dunkles Design" : "Helles Design"}</span></button>
                  <button className="account-menu-signout" type="button" role="menuitem" onClick={signOut}><SignOut size={17} /><span>Abmelden</span></button>
                </div>
              </div>}
            </div>}
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
      <Modal open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery("") }} title="Suchen" description="Finde Projekte, Features und App Teile im gesamten Workspace.">
        <div className="global-search">
          <div className="global-search-input"><MagnifyingGlass size={17} /><label className="visually-hidden" htmlFor="global-search-input">Suchbegriff</label><input id="global-search-input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Projekt, Feature oder App Teil suchen" autoFocus /></div>
          <div className="search-results">
            {projectResults.length > 0 && <div className="search-group"><span>Projekte</span>{projectResults.slice(0, 4).map((project) => <Link key={project.id} to={`/projects/${project.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}><span className="project-glyph" style={{ background: project.color }}>{project.icon}</span><strong>{project.name}</strong><small>{project.type}</small></Link>)}</div>}
            {appPartResults.length > 0 && <div className="search-group"><span>App Teile</span>{appPartResults.slice(0, 7).map((appPart) => <Link key={appPart.id} to={`/product/app-parts/${appPart.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}><span className="feature-key">{appPart.key}</span><strong>{appPart.name}</strong><small>{appPart.releaseState}</small></Link>)}</div>}
            {featureResults.length > 0 && <div className="search-group"><span>Features</span>{featureResults.slice(0, 7).map((feature) => <Link key={feature.id} to={`/projects/${feature.projectId}/features/${feature.id}`} onClick={() => { setSearchOpen(false); setSearchQuery("") }}><span className="feature-key">{feature.key}</span><strong>{feature.title}</strong><small>{feature.status}</small></Link>)}</div>}
            {!projectResults.length && !featureResults.length && !appPartResults.length && <div className="empty-state"><MagnifyingGlass size={24} /><strong>Keine Ergebnisse</strong><span>Versuche einen anderen Suchbegriff.</span></div>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
