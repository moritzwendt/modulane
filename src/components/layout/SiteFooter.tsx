import { ArrowUpRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { BrandLogo } from "../ui/BrandLogo"

type FooterLink = { label: string; to?: string; href?: string }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Produkt",
    links: [
      { label: "Übersicht", href: "/#produkt" },
      { label: "Arbeitsweise", href: "/#arbeitsweise" },
      { label: "Technische Reife", href: "/#reife" },
      { label: "Code und Commits", href: "/#code" },
      { label: "Rollen und Zugriff", href: "/#sicherheit" },
    ],
  },
  {
    title: "Ressourcen",
    links: [
      { label: "Häufige Fragen", href: "/#fragen" },
      { label: "Erste Schritte", to: "/register" },
      { label: "Anmelden", to: "/login" },
      { label: "Passwort vergessen", to: "/forgot" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über Modulane", href: "/#arbeitsweise" },
      { label: "Kontakt", href: "mailto:kontakt@modulane.app" },
      { label: "Support", href: "mailto:support@modulane.app" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", to: "/impressum" },
      { label: "Datenschutz", to: "/datenschutz" },
      { label: "Nutzungsbedingungen", to: "/agb" },
    ],
  },
]

export function SiteFooter({ anchorsOnly = false }: { anchorsOnly?: boolean }) {
  const resolve = (href: string) => (anchorsOnly ? href.replace("/#", "#") : href)

  return (
    <footer className="landing-footer">
      <div className="landing-shell">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="landing-brand" to="/" aria-label="Modulane Startseite">
              <span className="landing-brand-mark"><BrandLogo /></span>
              <strong>Modulane</strong>
            </Link>
            <p>Softwareklarheit für moderne Entwicklungsteams. Projekte, Komponenten und Aufgaben in einer fokussierten Arbeitsoberfläche.</p>
            <a className="footer-mail" href="mailto:kontakt@modulane.app"><ArrowUpRight size={14} />kontakt@modulane.app</a>
          </div>

          <div className="footer-columns">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <strong>{column.title}</strong>
                {column.links.map((link) => (
                  link.to
                    ? <Link key={link.label} to={link.to}>{link.label}</Link>
                    : <a key={link.label} href={resolve(link.href ?? "#")}>{link.label}</a>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Modulane. Alle Rechte vorbehalten.</span>
          <div className="footer-legal">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">Nutzungsbedingungen</Link>
          </div>
          <span className="footer-status"><span className="footer-status-dot" />Alle Systeme verfügbar</span>
        </div>
      </div>
    </footer>
  )
}
