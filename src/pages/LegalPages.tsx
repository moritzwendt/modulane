import { useEffect, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { SiteFooter } from "../components/layout/SiteFooter"
import { SiteHeader } from "../components/layout/SiteHeader"

const PLACEHOLDER = "[Bitte eintragen]"

function LegalLayout({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="landing legal-page">
      <SiteHeader />
      <main>
        <article className="legal-shell">
          <span className="section-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="legal-updated">Stand {updated}</p>
          <div className="legal-body">{children}</div>
          <Link className="landing-text-link legal-back" to="/">Zurück zur Startseite</Link>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}

export function ImprintPage() {
  return (
    <LegalLayout eyebrow="Rechtliches" title="Impressum" updated="August 2026">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>{PLACEHOLDER} (Name des Anbieters)<br />{PLACEHOLDER} (Straße und Hausnummer)<br />{PLACEHOLDER} (Postleitzahl und Ort)<br />{PLACEHOLDER} (Land)</p>

      <h2>Vertreten durch</h2>
      <p>{PLACEHOLDER} (vertretungsberechtigte Person)</p>

      <h2>Kontakt</h2>
      <p>E Mail: <a href="mailto:kontakt@modulane.app">kontakt@modulane.app</a><br />Telefon: {PLACEHOLDER}</p>

      <h2>Registereintrag</h2>
      <p>Registergericht: {PLACEHOLDER}<br />Registernummer: {PLACEHOLDER}</p>

      <h2>Umsatzsteuer Identifikationsnummer</h2>
      <p>{PLACEHOLDER}</p>

      <h2>Verantwortlich für den Inhalt nach § 18 Absatz 2 MStV</h2>
      <p>{PLACEHOLDER}</p>

      <h2>Streitbeilegung</h2>
      <p>Die Europäische Kommission stellt eine Plattform zur Online Streitbeilegung bereit. Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

      <p className="legal-note">Dieser Text ist eine Vorlage. Bitte ergänze die markierten Angaben und lasse das Impressum vor der Veröffentlichung rechtlich prüfen.</p>
    </LegalLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout eyebrow="Rechtliches" title="Datenschutzerklärung" updated="August 2026">
      <h2>Verantwortliche Stelle</h2>
      <p>{PLACEHOLDER} (Name und Anschrift des Verantwortlichen). Kontakt: <a href="mailto:kontakt@modulane.app">kontakt@modulane.app</a></p>

      <h2>Zweck der Verarbeitung</h2>
      <p>Modulane verarbeitet personenbezogene Daten, um die Arbeitsoberfläche bereitzustellen. Dazu gehören Konto und Anmeldedaten, Inhalte deiner Organisation wie Projekte, Komponenten, Aufgaben und Updates sowie technische Protokolle für Betrieb und Sicherheit.</p>

      <h2>Rechtsgrundlagen</h2>
      <p>Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags nach Artikel 6 Absatz 1 Buchstabe b DSGVO sowie auf Grundlage berechtigter Interessen an einem sicheren und stabilen Betrieb nach Artikel 6 Absatz 1 Buchstabe f DSGVO.</p>

      <h2>Konto und Anmeldung</h2>
      <p>Für die Nutzung werden Vorname, Nachname und E Mail Adresse gespeichert. Passwörter werden ausschließlich in verschlüsselter Form durch den Authentifizierungsdienst verarbeitet.</p>

      <h2>Auftragsverarbeitung</h2>
      <p>Für Datenbank, Authentifizierung und Dateispeicher setzen wir Supabase ein. Die Bereitstellung der Website erfolgt über {PLACEHOLDER} (Hosting Anbieter). Mit allen Dienstleistern bestehen Verträge zur Auftragsverarbeitung.</p>

      <h2>Speicherdauer</h2>
      <p>Daten werden gespeichert, solange dein Konto oder deine Organisation besteht. Nach einer Löschung werden Inhalte innerhalb von {PLACEHOLDER} Tagen entfernt, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

      <h2>Cookies und lokale Speicherung</h2>
      <p>Modulane verwendet technisch notwendige Speicherung im Browser, um deine Sitzung und deine Designeinstellung zu erhalten. Es findet keine Werbeverfolgung statt.</p>

      <h2>Deine Rechte</h2>
      <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.</p>

      <p className="legal-note">Dieser Text ist eine Vorlage. Bitte ergänze die markierten Angaben und lasse die Datenschutzerklärung vor der Veröffentlichung rechtlich prüfen.</p>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout eyebrow="Rechtliches" title="Nutzungsbedingungen" updated="August 2026">
      <h2>Geltungsbereich</h2>
      <p>Diese Bedingungen gelten für die Nutzung von Modulane durch registrierte Personen und deren Organisationen.</p>

      <h2>Konto und Organisation</h2>
      <p>Für die Nutzung ist ein persönliches Konto erforderlich. Zugangsdaten sind vertraulich zu behandeln. Die Organisation ist für die Vergabe von Rollen und Zugriffsrechten selbst verantwortlich.</p>

      <h2>Zulässige Nutzung</h2>
      <p>Modulane darf nicht für rechtswidrige Inhalte, für Angriffe auf die technische Infrastruktur oder für eine automatisierte Massenabfrage ohne Absprache genutzt werden.</p>

      <h2>Inhalte der Organisation</h2>
      <p>Alle eingestellten Inhalte verbleiben im Eigentum der jeweiligen Organisation. Wir verarbeiten sie ausschließlich, um den Dienst bereitzustellen.</p>

      <h2>Verfügbarkeit</h2>
      <p>Wir bemühen uns um einen durchgehenden Betrieb. Wartungsfenster und unvorhersehbare Störungen können die Verfügbarkeit vorübergehend einschränken.</p>

      <h2>Laufzeit und Kündigung</h2>
      <p>Die Nutzung kann jederzeit beendet werden. Nach der Kündigung werden die Inhalte gemäß der Datenschutzerklärung gelöscht.</p>

      <h2>Haftung</h2>
      <p>Wir haften nach den gesetzlichen Bestimmungen für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung wesentlicher Vertragspflichten. Im Übrigen ist die Haftung ausgeschlossen.</p>

      <h2>Änderungen</h2>
      <p>Änderungen dieser Bedingungen werden rechtzeitig angekündigt. Widersprichst du nicht innerhalb von {PLACEHOLDER} Tagen, gelten sie als angenommen.</p>

      <p className="legal-note">Dieser Text ist eine Vorlage. Bitte ergänze die markierten Angaben und lasse die Bedingungen vor der Veröffentlichung rechtlich prüfen.</p>
    </LegalLayout>
  )
}
