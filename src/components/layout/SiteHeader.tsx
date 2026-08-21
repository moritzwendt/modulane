import { ArrowRight, ArrowUpRight, List, X } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BrandLogo } from "../ui/BrandLogo"
import { useAuth } from "../../state/AuthContext"

const navigation = [
  { href: "/#produkt", label: "Produkt" },
  { href: "/#arbeitsweise", label: "Arbeitsweise" },
  { href: "/#reife", label: "Reife" },
  { href: "/#code", label: "Code" },
  { href: "/#fragen", label: "Fragen" },
]

export function SiteHeader({ anchorsOnly = false }: { anchorsOnly?: boolean }) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const primaryTarget = isAuthenticated ? "/dashboard" : "/register"
  const primaryLabel = isAuthenticated ? "Dashboard öffnen" : "Kostenlos starten"
  const links = anchorsOnly ? navigation.map((item) => ({ ...item, href: item.href.replace("/#", "#") })) : navigation

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle("landing-locked", open)
    return () => document.body.classList.remove("landing-locked")
  }, [open])

  return (
    <header className={scrolled ? "landing-header scrolled" : "landing-header"}>
      <div className="landing-header-inner">
        <Link className="landing-brand" to="/" aria-label="Modulane Startseite">
          <span className="landing-brand-mark"><BrandLogo /></span>
          <strong>Modulane</strong>
        </Link>

        <nav className="landing-nav" aria-label="Seitennavigation">
          {links.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        </nav>

        <div className="landing-header-actions">
          {!isAuthenticated && <Link className="landing-ghost" to="/login">Anmelden</Link>}
          <Link className="landing-button small" to={primaryTarget}>{primaryLabel}<ArrowRight size={15} weight="bold" /></Link>
        </div>

        <button
          className="landing-menu-button"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Navigation schließen" : "Navigation öffnen"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={19} /> : <List size={19} />}
        </button>
      </div>

      <div className={open ? "landing-drawer open" : "landing-drawer"} aria-hidden={!open}>
        <div className="landing-drawer-inner">
          <nav aria-label="Mobile Navigation">
            {links.map((item) => <a key={item.label} href={item.href} tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>{item.label}<ArrowUpRight size={15} /></a>)}
          </nav>
          <div className="landing-drawer-actions">
            {!isAuthenticated && <Link className="landing-button ghost" to="/login" tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>Anmelden</Link>}
            <Link className="landing-button" to={primaryTarget} tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>{primaryLabel}<ArrowRight size={15} weight="bold" /></Link>
          </div>
        </div>
      </div>
    </header>
  )
}
