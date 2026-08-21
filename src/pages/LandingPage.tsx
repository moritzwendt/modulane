import {
  ArrowRight,
  Check,
  CirclesFour,
  Cube,
  DeviceMobile,
  GitCommit,
  Kanban,
  ListChecks,
  LockKey,
  Minus,
  Moon,
  Plus,
  Pulse,
  ShieldCheck,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { SiteFooter } from "../components/layout/SiteFooter"
import { SiteHeader } from "../components/layout/SiteHeader"
import { useAuth } from "../state/AuthContext"

const objectModel = [
  { icon: Kanban, label: "Projekte", copy: "Produkte, Dienste und Plattformen deiner Organisation." },
  { icon: Cube, label: "Komponenten", copy: "Die dauerhaften Bereiche einer App mit eigenem Zustand." },
  { icon: ListChecks, label: "Aufgaben", copy: "Zeitlich begrenzte Arbeit mit klaren Anforderungen." },
  { icon: UsersThree, label: "Personen", copy: "Rollen, Beteiligung und aktuelle Verantwortung." },
] as const

const principles = [
  {
    icon: UsersThree,
    title: "Aktive Arbeit ist sichtbar",
    copy: "Jede Komponente zeigt, wer gerade daran arbeitet. Doppelte Arbeit und stille Konflikte fallen sofort auf.",
  },
  {
    icon: Pulse,
    title: "Reife ist eindeutig",
    copy: "Aufgabenfortschritt und technische Stabilität sind getrennt. Fertig entwickelt bedeutet nicht automatisch stabil.",
  },
  {
    icon: GitCommit,
    title: "Code bleibt optional",
    copy: "Commits ergänzen eine Komponente, wenn sie Kontext liefern. Ohne GitHub funktioniert alles genauso.",
  },
] as const

const productViews = [
  {
    id: "komponenten",
    label: "Komponenten",
    icon: Cube,
    title: "Jeder Bereich deiner App mit eigenem Zustand",
    copy: "Technische Reife, verknüpfte Aufgaben und die Personen, die eine Komponente gerade belegen.",
    image: "/screenshots/app-components.webp",
    path: "app.modulane.com/components",
  },
  {
    id: "aufgabe",
    label: "Aufgabe",
    icon: CirclesFour,
    title: "Eine Aufgabe zeigt alles, was zusammengehört",
    copy: "Anforderungen, Personen, verknüpfte Komponenten und der Hinweis, wenn jemand anderes bereits daran arbeitet.",
    image: "/screenshots/app-task.webp",
    path: "app.modulane.com/projects/nova-mobile/tasks/nov-14",
  },
  {
    id: "aufgaben",
    label: "Alle Aufgaben",
    icon: ListChecks,
    title: "Arbeit mit Anforderungen statt Bauchgefühl",
    copy: "Status, Priorität, Zieldatum und Fortschritt aus erfüllten Anforderungen. Belegte Komponenten sind markiert.",
    image: "/screenshots/app-tasks.webp",
    path: "app.modulane.com/tasks",
  },
  {
    id: "team",
    label: "Team",
    icon: UsersThree,
    title: "Rollen und Verantwortung an einem Ort",
    copy: "Wer darf was, wer arbeitet woran und wann war jemand zuletzt aktiv.",
    image: "/screenshots/app-team.webp",
    path: "app.modulane.com/team",
  },
] as const

const maturityStates = [
  { name: "In Entwicklung", copy: "Die Kernstruktur entsteht und Schnittstellen verändern sich noch.", tone: "violet", signal: "Änderungen erwartet" },
  { name: "Instabil", copy: "Die Kernfunktion steht, bekannte Risiken werden noch geschlossen.", tone: "amber", signal: "Mit Vorsicht verwenden" },
  { name: "Stabil", copy: "Alle Anforderungen sind erfüllt und der Review ist abgeschlossen.", tone: "blue", signal: "Bereit für Abhängigkeiten" },
  { name: "Production Ready", copy: "Die Komponente ist geprüft, veröffentlicht und wird überwacht.", tone: "green", signal: "Im Betrieb" },
] as const

const roles = [
  { name: "Eigentümer", copy: "Vollständige Kontrolle über Organisation, Sicherheit und Zugänge." },
  { name: "Administrator", copy: "Verwaltet Projekte, Mitglieder und die täglichen Einstellungen." },
  { name: "Mitglied", copy: "Bearbeitet Aufgaben und arbeitet an Komponenten." },
  { name: "Gast", copy: "Arbeitet ausschließlich in zugewiesenen Projekten." },
] as const

const questions = [
  {
    q: "Ersetzt Modulane unser Ticketsystem?",
    a: "Modulane deckt Projekte, Komponenten, Aufgaben und Anforderungen ab. Viele Teams ersetzen damit ihr Board vollständig. Wenn ihr ein Ticketsystem für Support behaltet, bleibt Modulane die Ebene für den Produktzustand.",
  },
  {
    q: "Brauchen wir GitHub, damit Modulane funktioniert?",
    a: "Nein. Commits und Code Links sind eine freiwillige Ergänzung pro Komponente. Ohne Verknüpfung bleibt jede Funktion nutzbar.",
  },
  {
    q: "Worin unterscheidet sich der Status einer Aufgabe von der Reife einer Komponente?",
    a: "Der Status beschreibt die Arbeit, die Reife beschreibt das Ergebnis. Eine Aufgabe kann fertig sein, während die Komponente noch instabil ist. Modulane hält beides getrennt, damit Übergaben ehrlich bleiben.",
  },
  {
    q: "Wie kommen neue Personen in die Organisation?",
    a: "Über eine Einladung per E Mail oder über einen zeitlich begrenzten Zugangscode mit fester Rolle. Beides wird in den Organisationseinstellungen verwaltet.",
  },
  {
    q: "Können wir Projekte privat halten?",
    a: "Ja. Projekte sind entweder für die gesamte Organisation sichtbar oder auf ausgewählte Mitglieder begrenzt. Gäste sehen ausschließlich zugewiesene Projekte.",
  },
  {
    q: "Was kostet Modulane?",
    a: "Der Einstieg ist kostenlos und ohne Kreditkarte möglich. Du erstellst deine Organisation und lädst dein Team direkt ein.",
  },
] as const

function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (!elements.length) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("revealed"))
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("revealed")
        observer.unobserve(entry.target)
      })
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function AppFrame({ path, children, tone = "light" }: { path: string; children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <div className={`app-frame app-frame-${tone}`}>
      <div className="app-frame-bar">
        <span className="app-frame-dots"><i /><i /><i /></span>
        <span className="app-frame-path">{path}</span>
      </div>
      <div className="app-frame-body">{children}</div>
    </div>
  )
}

function Shot({ src, alt, width, height, priority = false }: { src: string; alt: string; width: number; height: number; priority?: boolean }) {
  return <img className="app-shot" src={src} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} decoding="async" />
}

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [viewIndex, setViewIndex] = useState(0)
  const [maturityIndex, setMaturityIndex] = useState(0)
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const primaryTarget = isAuthenticated ? "/dashboard" : "/register"
  const primaryLabel = isAuthenticated ? "Dashboard öffnen" : "Kostenlos starten"
  const activeView = productViews[viewIndex]
  const activeMaturity = maturityStates[maturityIndex]

  useReveal()

  useEffect(() => {
    const frame = requestAnimationFrame(() => heroRef.current?.classList.add("landed"))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="landing">
      <a className="landing-skip" href="#produkt">Zum Inhalt springen</a>

      <SiteHeader anchorsOnly />

      <main>
        <section className="hero">
          <div className="hero-aura" aria-hidden="true" />
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-inner">
            <span className="hero-badge" data-reveal><span className="hero-badge-dot" />Für Teams, die Software in Bereichen denken</span>
            <h1 data-reveal style={{ "--delay": "60ms" } as React.CSSProperties}>
              Jeder Teil deiner App.
              <span className="hero-accent">Arbeit klar sichtbar.</span>
            </h1>
            <p className="hero-lede" data-reveal style={{ "--delay": "120ms" } as React.CSSProperties}>
              Modulane zeigt, wer gerade woran arbeitet, wie stabil eine Komponente wirklich ist und was bis zur Veröffentlichung noch fehlt. Ohne zusätzliche Verwaltungsebene.
            </p>
            <div className="hero-actions" data-reveal style={{ "--delay": "180ms" } as React.CSSProperties}>
              <Link className="landing-button large" to={primaryTarget}>{primaryLabel}<ArrowRight size={17} weight="bold" /></Link>
              <a className="landing-button large ghost" href="#produkt">Produkt ansehen</a>
            </div>
            <ul className="hero-proof" data-reveal style={{ "--delay": "240ms" } as React.CSSProperties}>
              <li><Check size={13} weight="bold" />Keine Kreditkarte</li>
              <li><Check size={13} weight="bold" />In Minuten eingerichtet</li>
              <li><Check size={13} weight="bold" />Helles und dunkles Design</li>
            </ul>
          </div>

          <div className="hero-stage" ref={heroRef}>
            <AppFrame path="app.modulane.com/dashboard">
              <Shot src="/screenshots/app-dashboard.webp" alt="Übersichtsseite von Modulane mit aktiven Aufgaben, Risiken und Updates" width={2880} height={1800} priority />
            </AppFrame>
          </div>
        </section>

        <section className="object-model" aria-label="Das Modell hinter Modulane">
          <div className="landing-shell">
            <div className="object-model-grid">
              {objectModel.map((item, index) => (
                <article key={item.label} data-reveal style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}>
                  <item.icon size={19} />
                  <strong>{item.label}</strong>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="product-section" id="produkt">
          <div className="landing-shell">
            <div className="section-head" data-reveal>
              <span className="section-eyebrow">Produkt</span>
              <h2>Vier Ansichten, ein gemeinsamer Stand</h2>
              <p>Jede Ansicht arbeitet mit denselben Daten. Was im Team passiert, ist überall sofort sichtbar.</p>
            </div>

            <div className="view-switcher" role="tablist" aria-label="Produktansichten" data-reveal>
              {productViews.map((view, index) => (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  id={`view-tab-${view.id}`}
                  aria-selected={viewIndex === index}
                  aria-controls={`view-panel-${view.id}`}
                  className={viewIndex === index ? "active" : ""}
                  onClick={() => setViewIndex(index)}
                >
                  <view.icon size={16} />
                  {view.label}
                </button>
              ))}
            </div>

            <div className="view-panel" id={`view-panel-${activeView.id}`} role="tabpanel" aria-labelledby={`view-tab-${activeView.id}`} data-reveal>
              <div className="view-copy" key={`${activeView.id}-copy`}>
                <h3>{activeView.title}</h3>
                <p>{activeView.copy}</p>
              </div>
              <div className="view-stage" key={activeView.id}>
                <AppFrame path={activeView.path}>
                  <Shot src={activeView.image} alt={`Ansicht ${activeView.label} in Modulane`} width={2880} height={1800} />
                </AppFrame>
              </div>
            </div>
          </div>
        </section>

        <section className="principles" id="arbeitsweise">
          <div className="landing-shell">
            <div className="section-head" data-reveal>
              <span className="section-eyebrow">Arbeitsweise</span>
              <h2>Drei Entscheidungen, die den Unterschied machen</h2>
              <p>Modulane ist bewusst schmal gehalten. Was bleibt, ist das, was Teams im Alltag wirklich brauchen.</p>
            </div>
            <div className="principle-grid">
              {principles.map((principle, index) => (
                <article key={principle.title} data-reveal style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}>
                  <span className="principle-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="principle-icon"><principle.icon size={20} /></span>
                  <h3>{principle.title}</h3>
                  <p>{principle.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="visibility">
          <div className="landing-shell">
            <div className="visibility-grid">
              <div className="visibility-copy" data-reveal>
                <span className="section-eyebrow">Sichtbare Arbeit</span>
                <h2>Niemand arbeitet aus Versehen doppelt</h2>
                <p>Sobald jemand eine Komponente belegt, sehen alle anderen es in der Aufgabe, in der Liste und im Team. Abstimmung passiert vorher statt im Review.</p>
                <ul className="check-list">
                  <li><Check size={13} weight="bold" />Belegte Komponenten werden direkt in der Aufgabe gemeldet</li>
                  <li><Check size={13} weight="bold" />Fortschritt entsteht aus erfüllten Anforderungen</li>
                  <li><Check size={13} weight="bold" />Updates halten den Verlauf nachvollziehbar</li>
                </ul>
              </div>
              <figure className="detail-card" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
                <div className="detail-scroll"><img src="/screenshots/detail-progress.webp" alt="Fortschritt einer Aufgabe berechnet aus erfüllten Anforderungen" width={1670} height={920} loading="lazy" decoding="async" /></div>
              </figure>
            </div>
            <figure className="detail-card wide" data-reveal>
              <div className="detail-scroll"><img src="/screenshots/detail-context.webp" alt="Hinweis in einer Aufgabe, dass eine Komponente bereits von einer anderen Person bearbeitet wird" width={2290} height={300} loading="lazy" decoding="async" /></div>
              <figcaption>Der Hinweis erscheint direkt in der Aufgabe, bevor jemand mit der Arbeit beginnt</figcaption>
            </figure>
          </div>
        </section>

        <section className="maturity" id="reife">
          <div className="landing-shell">
            <div className="section-head" data-reveal>
              <span className="section-eyebrow">Technische Reife</span>
              <h2>Ein Zustand, den das ganze Team versteht</h2>
              <p>Modulane trennt den Fortschritt der Aufgaben vom Zustand der Komponenten. Das verhindert falsche Sicherheit und macht Übergaben klar.</p>
            </div>

            <div className="maturity-panel" data-reveal>
              <div className="maturity-rail" role="tablist" aria-label="Technischer Zustand">
                {maturityStates.map((state, index) => (
                  <button
                    key={state.name}
                    type="button"
                    role="tab"
                    aria-selected={maturityIndex === index}
                    className={maturityIndex === index ? `active tone-${state.tone}` : `tone-${state.tone}`}
                    onClick={() => setMaturityIndex(index)}
                  >
                    <span className="maturity-dot" />
                    <strong>{state.name}</strong>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </button>
                ))}
              </div>
              <div className={`maturity-detail tone-${activeMaturity.tone}`} key={activeMaturity.name}>
                <span className="maturity-detail-icon"><ShieldCheck size={22} /></span>
                <div>
                  <span className="maturity-signal">{activeMaturity.signal}</span>
                  <h3>{activeMaturity.name}</h3>
                  <p>{activeMaturity.copy}</p>
                </div>
              </div>
            </div>

            <figure className="detail-card full" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
              <div className="detail-scroll"><img src="/screenshots/detail-maturity.webp" alt="Komponentenliste eines Projekts mit den technischen Zuständen In Entwicklung, Instabil, Stabil und Production Ready" width={2268} height={780} loading="lazy" decoding="async" /></div>
              <figcaption>Alle vier Zustände nebeneinander in einem Projekt</figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-code" id="code">
          <div className="landing-shell code-grid">
            <div className="code-copy" data-reveal>
              <span className="section-eyebrow">Code und Commits</span>
              <h2>Genug technischer Kontext. Kein Zwang.</h2>
              <p>Commits ergänzen eine Komponente, ohne sie in ein Entwicklerwerkzeug zu verwandeln. Repository, Branch und Link bleiben sauber zugeordnet.</p>
              <ul className="check-list">
                <li><Check size={13} weight="bold" />Commits gezielt hinzufügen statt automatisch spiegeln</li>
                <li><Check size={13} weight="bold" />Ein Repository pro Projekt</li>
                <li><Check size={13} weight="bold" />Direkte Links zur Änderung</li>
              </ul>
              <Link className="landing-text-link" to={primaryTarget}>Modulane ausprobieren<ArrowRight size={15} /></Link>
            </div>
            <figure className="detail-card tilt" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
              <div className="detail-scroll"><img src="/screenshots/detail-code.webp" alt="Bereich Code und Commits einer Komponente mit verknüpftem Repository und drei Commits" width={1740} height={1335} loading="lazy" decoding="async" /></div>
            </figure>
          </div>
        </section>

        <section className="surfaces">
          <div className="landing-shell">
            <div className="section-head" data-reveal>
              <span className="section-eyebrow">Überall zu Hause</span>
              <h2>Hell, dunkel und auf jedem Bildschirm</h2>
              <p>Dieselbe Oberfläche am großen Monitor, im dunklen Design und unterwegs auf dem Telefon.</p>
            </div>
            <div className="surfaces-grid">
              <div className="surface-dark" data-reveal>
                <AppFrame path="app.modulane.com/dashboard" tone="dark">
                  <Shot src="/screenshots/app-dashboard-dark.webp" alt="Modulane im dunklen Design" width={2880} height={1800} />
                </AppFrame>
                <div className="surface-note"><Moon size={16} />Dunkles Design</div>
              </div>
              <div className="surface-mobile" data-reveal style={{ "--delay": "100ms" } as React.CSSProperties}>
                <div className="phone-frame">
                  <Shot src="/screenshots/app-mobile.webp" alt="Modulane auf einem schmalen Bildschirm" width={1000} height={2080} />
                </div>
                <div className="surface-note"><DeviceMobile size={16} />Mobil bedienbar</div>
              </div>
            </div>
          </div>
        </section>

        <section className="security" id="sicherheit">
          <div className="landing-shell">
            <div className="section-head" data-reveal>
              <span className="section-eyebrow">Rollen und Zugriff</span>
              <h2>Zugriff, der zur Organisation passt</h2>
              <p>Vier Rollen, private Projekte und zeitlich begrenzte Zugangscodes sind Teil des Systems.</p>
            </div>
            <div className="role-grid">
              {roles.map((role, index) => (
                <article key={role.name} data-reveal style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}>
                  <span className="role-accent" />
                  <strong>{role.name}</strong>
                  <p>{role.copy}</p>
                </article>
              ))}
            </div>
            <div className="security-notes">
              <div data-reveal><LockKey size={20} /><span><strong>Private Projekte</strong><p>Sichtbarkeit pro Projekt festlegen. Gäste sehen nur, was ihnen zugewiesen ist.</p></span></div>
              <div data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}><ShieldCheck size={20} /><span><strong>Zugangscodes mit Ablauf</strong><p>Neue Personen treten mit fester Rolle bei. Codes lassen sich jederzeit erneuern.</p></span></div>
              <div data-reveal style={{ "--delay": "160ms" } as React.CSSProperties}><Sparkle size={20} /><span><strong>Sofort aktuell</strong><p>Alle Inhalte werden sicher gespeichert und stehen dem Team direkt zur Verfügung.</p></span></div>
            </div>
          </div>
        </section>

        <section className="faq" id="fragen">
          <div className="landing-shell faq-grid">
            <div className="faq-head" data-reveal>
              <span className="section-eyebrow">Häufige Fragen</span>
              <h2>Kurz beantwortet</h2>
              <p>Noch etwas offen? Schreib uns an <a href="mailto:kontakt@modulane.app">kontakt@modulane.app</a>.</p>
            </div>
            <div className="faq-list" data-reveal>
              {questions.map((item, index) => {
                const open = openQuestion === index
                return (
                  <div className={open ? "faq-item open" : "faq-item"} key={item.q}>
                    <button type="button" aria-expanded={open} onClick={() => setOpenQuestion(open ? null : index)}>
                      <span>{item.q}</span>
                      {open ? <Minus size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
                    </button>
                    <div className="faq-answer"><p>{item.a}</p></div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="landing-shell">
            <div className="final-cta-panel" data-reveal>
              <div className="final-cta-glow" aria-hidden="true" />
              <span className="section-eyebrow">Bereit für dein nächstes Projekt</span>
              <h2>Bring Klarheit in jeden Teil deiner App</h2>
              <p>Erstelle deine Organisation und sieh sofort, woran dein Team arbeitet.</p>
              <div className="final-cta-actions">
                <Link className="landing-button large light" to={primaryTarget}>{primaryLabel}<ArrowRight size={17} weight="bold" /></Link>
                {!isAuthenticated && <Link className="landing-button large ghost-light" to="/login">Bereits registriert</Link>}
              </div>
              <ul className="hero-proof light">
                <li><Check size={13} weight="bold" />Keine Kreditkarte</li>
                <li><Check size={13} weight="bold" />Jederzeit kündbar</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter anchorsOnly />
    </div>
  )
}
