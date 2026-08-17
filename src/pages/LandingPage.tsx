import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code,
  GitCommit,
  GitPullRequest,
  ListChecks,
  LockKey,
  Pulse,
  ShieldCheck,
  Sparkle,
  UsersThree,
  X,
  List,
} from "@phosphor-icons/react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { BrandLogo } from "../components/ui/BrandLogo"
import { useAuth } from "../state/AuthContext"

const maturityStates = [
  { name: "In Entwicklung", copy: "Die Kernstruktur entsteht und Schnittstellen verändern sich noch.", color: "violet" },
  { name: "Instabil", copy: "Die Kernfunktion steht, bekannte Risiken werden noch geschlossen.", color: "amber" },
  { name: "Stabil", copy: "Alle Anforderungen sind erfüllt und der Review ist abgeschlossen.", color: "blue" },
  { name: "Production Ready", copy: "Die Komponente ist geprüft, veröffentlicht und wird überwacht.", color: "green" },
] as const

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [maturityIndex, setMaturityIndex] = useState(0)
  const primaryTarget = isAuthenticated ? "/dashboard" : "/register"
  const primaryLabel = isAuthenticated ? "Dashboard öffnen" : "Kostenlos starten"
  const selectedMaturity = maturityStates[maturityIndex]

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Modulane Startseite"><span><BrandLogo /></span><strong>Modulane</strong></Link>
        <nav className={mobileNavOpen ? "landing-nav open" : "landing-nav"} aria-label="Seitennavigation">
          <a href="#product" onClick={() => setMobileNavOpen(false)}>Vorschau</a>
          <a href="#workflow" onClick={() => setMobileNavOpen(false)}>Arbeitsweise</a>
          <a href="#code" onClick={() => setMobileNavOpen(false)}>Code</a>
          <a href="#security" onClick={() => setMobileNavOpen(false)}>Sicherheit</a>
        </nav>
        <div className="landing-header-actions">
          {!isAuthenticated && <Link className="landing-login" to="/login">Anmelden</Link>}
          <Link className="landing-button compact" to={primaryTarget}>{primaryLabel}<ArrowRight size={14} /></Link>
        </div>
        <button className="landing-menu-button" type="button" onClick={() => setMobileNavOpen((value) => !value)} aria-label={mobileNavOpen ? "Navigation schließen" : "Navigation öffnen"}>{mobileNavOpen ? <X size={19} /> : <List size={19} />}</button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-kicker"><span className="release-dot active" />Entwickelt für moderne Softwareteams</div>
          <h1>Jeder Teil deiner App.<br />Arbeit klar sichtbar.</h1>
          <p>Modulane zeigt, wer woran arbeitet, wie stabil eine Komponente ist und was noch bis zur Veröffentlichung fehlt. Ohne unnötige Verwaltungsebenen.</p>
          <div className="hero-actions"><Link className="landing-button" to={primaryTarget}>{primaryLabel}<ArrowRight size={16} /></Link><a className="landing-text-link" href="#product">Vorschau ansehen<ArrowRight size={15} /></a></div>
          <div className="hero-proof"><span><Check size={13} weight="bold" />Keine Kreditkarte</span><span><Check size={13} weight="bold" />In Minuten eingerichtet</span><span><Check size={13} weight="bold" />Für dein Team</span></div>
        </section>

        <section className="landing-product-stage" id="product" aria-label="Anwendungsvorschau">
          <div className="product-glow" />
          <div className="landing-app-window">
            <div className="window-bar"><div className="window-controls"><span /><span /><span /></div><div className="window-command"><span>Suchen</span><kbd>⌘ K</kbd></div><div className="window-avatar">MW</div></div>
            <div className="window-body">
              <aside className="window-sidebar">
                <div className="window-workspace"><span><BrandLogo /></span><strong>SDX Solutions</strong></div>
                <div className="window-nav-list"><span><Pulse size={15} />Übersicht</span><span className="selected"><ListChecks size={15} />Komponenten</span><span><UsersThree size={15} />Team</span></div>
                <small>PROJEKTE</small>
                <div className="window-project-list"><span><i className="nova">N</i>Nova Mobile</span><span><i className="atlas">A</i>Atlas Admin</span><span><i className="relay">R</i>Relay API</span></div>
              </aside>
              <div className="window-content">
                <div className="window-content-top"><span>Nova Mobile&nbsp;&nbsp;/&nbsp;&nbsp;NOV 14</span><button><UsersThree size={14} />Personen</button></div>
                <div className="window-feature-heading"><span>NOV 14</span><h2>Anmeldung und Registrierung</h2><p>Ein verlässlicher Einstieg für bestehende und neue Kunden.</p></div>
                <div className="window-state-grid">
                  <div><UsersThree size={16} /><span><small>Gerade aktiv</small><strong>Lina, Moritz</strong></span><div className="mini-avatars"><i>LB</i><i>MW</i></div></div>
                  <div><ShieldCheck size={16} /><span><small>Technischer Zustand</small><strong>In Entwicklung</strong></span><b>Aktiv</b></div>
                  <div><GitCommit size={16} /><span><small>Optionale Commits</small><strong>2 verknüpft</strong></span><ArrowRight size={13} /></div>
                </div>
                <div className="window-detail-grid">
                  <div className="window-requirements"><div><strong>Anforderungen</strong><span>3 von 5 erfüllt</span></div>{["Anmeldung mit E Mail", "Registrierung bestätigen", "Passwort zurücksetzen", "Sitzung sicher speichern"].map((item, index) => <p key={item} className={index < 2 ? "done" : ""}><i>{index < 2 && <Check size={10} weight="bold" />}</i>{item}</p>)}</div>
                  <div className="window-properties"><p><span>Status</span><strong>In Arbeit</strong></p><p><span>Priorität</span><strong>Hoch</strong></p><p><span>Zustand</span><strong>In Entwicklung</strong></p><p><span>Gerade aktiv</span><strong><i>MW</i>Moritz</strong></p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-intro" id="workflow">
          <div className="landing-section-label">Ein System für technische Klarheit</div>
          <h2>Software besteht aus Bereichen.<br />Modulane macht ihren Zustand sichtbar.</h2>
          <p>Von der ersten Idee bis zur stabilen Komponente bleibt alles an einem Ort. Personen, Anforderungen, Entscheidungen und relevante Codeänderungen.</p>
        </section>

        <section className="landing-principles">
          <article><span>01</span><UsersThree size={21} /><h3>Aktive Arbeit ist sichtbar</h3><p>Das Team sieht direkt, wer gerade eine Komponente bearbeitet und wo Abstimmung nötig ist.</p></article>
          <article><span>02</span><Pulse size={21} /><h3>Reife ist eindeutig</h3><p>Arbeitsstatus und technische Stabilität haben eigene Zustände. Eine Komponente kann fertig entwickelt und trotzdem noch instabil sein.</p></article>
          <article><span>03</span><GitCommit size={21} /><h3>Code bleibt optional</h3><p>Verknüpfe Commits und Pull Requests nur dann, wenn sie wichtigen Kontext liefern. Die Komponente funktioniert auch ohne GitHub.</p></article>
        </section>

        <section className="maturity-section">
          <div className="maturity-copy"><span className="landing-section-label">Technische Reife</span><h2>Ein Zustand, den das ganze Team versteht.</h2><p>Modulane trennt den Fortschritt der Aufgaben vom Zustand der Komponenten. Das verhindert falsche Sicherheit und macht Übergaben klar.</p><Link className="landing-text-link" to={primaryTarget}>Modulane ausprobieren<ArrowRight size={15} /></Link></div>
          <div className="maturity-console">
            <div className="maturity-console-top"><span>NOV 14</span><strong>Anmeldung und Registrierung</strong><span className={`maturity-light ${selectedMaturity.color}`} /></div>
            <div className="maturity-rail" role="tablist" aria-label="Technischer Zustand">
              {maturityStates.map((state, index) => <button key={state.name} type="button" role="tab" aria-selected={maturityIndex === index} className={maturityIndex === index ? "active" : ""} onClick={() => setMaturityIndex(index)}><span>{index + 1}</span><strong>{state.name}</strong></button>)}
            </div>
            <div className="maturity-detail"><span className={`maturity-icon ${selectedMaturity.color}`}><ShieldCheck size={22} /></span><div><small>Aktueller Zustand</small><h3>{selectedMaturity.name}</h3><p>{selectedMaturity.copy}</p></div><div className="maturity-owner"><span>GERADE AKTIV</span><strong><i>LB</i>Lina Becker</strong></div></div>
          </div>
        </section>

        <section className="code-section-landing" id="code">
          <div className="code-section-copy"><span className="landing-section-label">Komponenten und Code</span><h2>Genug technischer Kontext. Kein Zwang.</h2><p>Commits ergänzen eine Komponente, ohne sie in ein Entwicklerwerkzeug zu verwandeln. Repository, Branch und Code Link bleiben sauber zugeordnet.</p><div className="code-benefits"><span><Check size={13} weight="bold" />Commits gezielt hinzufügen</span><span><Check size={13} weight="bold" />Repository pro Projekt</span><span><Check size={13} weight="bold" />Direkte Links zum Code</span></div></div>
          <div className="landing-code-preview">
            <div className="code-preview-head"><Code size={18} /><strong>Code und Commits</strong><span>2 verknüpft</span></div>
            <div className="landing-commit"><code>7c31a9f</code><span><strong>Anmeldeformular und Validierung ergänzen</strong><small>task/anmeldung&nbsp;&nbsp;/&nbsp;&nbsp;Lina Becker</small></span><ArrowUpRight size={15} /></div>
            <div className="landing-commit"><code>d9f44c2</code><span><strong>Sitzungsstatus lokal speichern</strong><small>main&nbsp;&nbsp;/&nbsp;&nbsp;Moritz Wendt</small></span><ArrowUpRight size={15} /></div>
            <div className="pull-request-preview"><GitPullRequest size={17} /><span><strong>Code Referenz erfasst</strong><small>Branch und Link führen direkt zur Änderung.</small></span></div>
          </div>
        </section>

        <section className="landing-security" id="security">
          <div><LockKey size={22} /><span><strong>Für echte Teams</strong><p>Rollen, private Projekte und geschützter Organisationszugriff sind Teil des Systems.</p></span></div>
          <div><Sparkle size={22} /><span><strong>Gemeinsam und aktuell</strong><p>Alle Inhalte werden sicher gespeichert und stehen dem Team sofort zur Verfügung.</p></span></div>
        </section>

        <section className="landing-final-cta">
          <span className="landing-section-label">Bereit für dein nächstes Projekt</span>
          <h2>Bring Klarheit in jeden Teil deiner App.</h2>
          <p>Erstelle deine Organisation und sieh sofort, woran dein Team arbeitet.</p>
          <div><Link className="landing-button light" to={primaryTarget}>{primaryLabel}<ArrowRight size={16} /></Link>{!isAuthenticated && <Link className="landing-text-link light" to="/login">Bereits registriert</Link>}</div>
        </section>
      </main>

      <footer className="landing-footer"><Link className="landing-logo" to="/"><span><BrandLogo /></span><strong>Modulane</strong></Link><p>Softwareklarheit für moderne Entwicklungsteams.</p><nav><a href="#product">Vorschau</a><a href="#workflow">Arbeitsweise</a><Link to="/login">Anmelden</Link></nav></footer>
    </div>
  )
}
