import { ArrowRight, Check, Eye, EyeSlash, GitCommit, ShieldCheck, UsersThree } from "@phosphor-icons/react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { BrandLogo } from "../components/ui/BrandLogo"
import { useAuth } from "../state/AuthContext"

export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Modulane Vorschau">
        <div className="auth-brand"><span><BrandLogo /></span><strong>Modulane</strong></div>
        <div className="auth-story-copy">
          <span className="auth-eyebrow">Arbeitszustand auf einen Blick</span>
          <h1>Jeder Appteil hat einen klaren Besitzer und einen echten Zustand.</h1>
          <p>Plane Produktbereiche, sieh aktive Arbeit und halte technische Reife dort fest, wo dein Team sie braucht.</p>
        </div>
        <div className="auth-product-preview">
          <div className="preview-top"><span>NOV 14</span><strong>Anmeldung und Registrierung</strong><span className="release-dot unstable" />In Entwicklung</div>
          <div className="preview-lanes">
            <div><UsersThree size={17} /><span>Aktiv</span><strong>Lina und Moritz</strong></div>
            <div><ShieldCheck size={17} /><span>Zustand</span><strong>Instabil</strong></div>
            <div><GitCommit size={17} /><span>Letzter Commit</span><strong>7c31a9f</strong></div>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-heading"><h2>{title}</h2><p>{description}</p></div>
          {children}
        </div>
        <p className="auth-legal">Mit der Nutzung stimmst du den Bedingungen und dem Datenschutz zu.</p>
      </section>
    </main>
  )
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (result.error) return setError(result.error)
    navigate("/dashboard")
  }

  return (
    <AuthLayout title="Willkommen zurück" description="Melde dich in deinem Workspace an.">
      <form className="auth-form" onSubmit={submit}>
        <div className="field-group"><label htmlFor="login-email">E Mail Adresse</label><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus /></div>
        <div className="field-group"><div className="field-label-row"><label htmlFor="login-password">Passwort</label><Link to="/forgot">Passwort vergessen</Link></div><div className="password-field"><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Passwort ausblenden" : "Passwort anzeigen"}>{showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}</button></div></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Anmeldung läuft" : "Anmelden"}<ArrowRight size={16} /></button>
      </form>
      <div className="auth-switch">Noch kein Konto? <Link to="/register">Konto erstellen</Link></div>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [input, setInput] = useState({ name: "", email: "", password: "" })
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accepted) return setError("Bitte bestätige die Bedingungen.")
    setSubmitting(true)
    const result = await register(input)
    setSubmitting(false)
    if (result.error) return setError(result.error)
    if (result.confirmationRequired) {
      setConfirmationEmail(input.email)
      return
    }
    navigate("/onboarding")
  }

  if (confirmationEmail) return <AuthLayout title="E Mail bestätigen" description="Dein persönliches Konto wurde erstellt."><div className="auth-success"><span><Check size={20} weight="bold" /></span><h3>Bestätigungslink gesendet</h3><p>Öffne die Nachricht an {confirmationEmail}. Danach kannst du eine Organisation erstellen oder einer beitreten.</p><Link className="button primary" to="/login">Zur Anmeldung</Link></div></AuthLayout>

  return (
    <AuthLayout title="Konto erstellen" description="Erstelle zuerst dein persönliches Modulane Konto.">
      <form className="auth-form" onSubmit={submit}>
        <div className="field-group"><label htmlFor="register-name">Vollständiger Name</label><input id="register-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus /></div>
        <div className="field-group"><label htmlFor="register-email">E Mail Adresse</label><input id="register-email" type="email" value={input.email} onChange={(event) => setInput({ ...input, email: event.target.value })} /></div>
        <div className="field-group"><label htmlFor="register-password">Passwort</label><input id="register-password" type="password" value={input.password} onChange={(event) => setInput({ ...input, password: event.target.value })} /><p className="field-helper">Mindestens acht Zeichen.</p></div>
        <label className="terms-choice"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span className="custom-check">{accepted && <Check size={13} weight="bold" />}</span><span>Ich akzeptiere die Bedingungen und den Datenschutz.</span></label>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Konto wird erstellt" : "Konto erstellen"}<ArrowRight size={16} /></button>
      </form>
      <div className="auth-switch">Bereits registriert? <Link to="/login">Anmelden</Link></div>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await requestPasswordReset(email)
    setSubmitting(false)
    if (result.error) return setError(result.error)
    setError("")
    setSent(true)
  }

  return (
    <AuthLayout title="Passwort zurücksetzen" description="Wir bereiten einen sicheren Link für dein Konto vor.">
      {sent ? <div className="auth-success"><span><Check size={20} weight="bold" /></span><h3>Link gesendet</h3><p>Wenn ein Konto für {email} besteht, erhältst du jetzt einen sicheren Link.</p><Link className="button primary" to="/login">Zur Anmeldung</Link></div> : <form className="auth-form" onSubmit={submit}><div className="field-group"><label htmlFor="reset-email">E Mail Adresse</label><input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus /></div>{error && <div className="form-alert" role="alert">{error}</div>}<button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Link wird gesendet" : "Link anfordern"}<ArrowRight size={16} /></button></form>}
      {!sent && <div className="auth-switch"><Link to="/login">Zurück zur Anmeldung</Link></div>}
    </AuthLayout>
  )
}

export function UpdatePasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (result.error) return setError(result.error)
    navigate("/dashboard")
  }

  return <AuthLayout title="Neues Passwort" description="Lege ein neues Passwort für dein Konto fest."><form className="auth-form" onSubmit={submit}><div className="field-group"><label htmlFor="new-password">Neues Passwort</label><input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" autoFocus /><p className="field-helper">Mindestens acht Zeichen.</p></div>{error && <div className="form-alert" role="alert">{error}</div>}<button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Passwort wird gespeichert" : "Passwort speichern"}<ArrowRight size={16} /></button></form></AuthLayout>
}
