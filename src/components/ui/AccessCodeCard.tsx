import { Check, Copy, HourglassMedium } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import type { JoinCodeRole } from "../../domain/types"

interface AccessCodeCardProps {
  code: string
  role: JoinCodeRole
  expiresAt: string
}

const remainingLabel = (seconds: number) => {
  if (seconds <= 0) return "Abgelaufen"
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes} Min ${String(rest).padStart(2, "0")} Sek`
}

export function AccessCodeCard({ code, role, expiresAt }: AccessCodeCardProps) {
  const [copied, setCopied] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(3600)
  const expiresAtTime = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])
  const progress = Math.min(100, remainingSeconds / 36)
  const expired = remainingSeconds === 0

  useEffect(() => {
    const timer = window.setInterval(() => setRemainingSeconds(Math.max(0, Math.ceil((expiresAtTime - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [expiresAtTime])

  const copy = async () => {
    await navigator.clipboard.writeText(code.replace(/\s/g, ""))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className={`access-code-card${expired ? " expired" : ""}`}>
    <div className="access-code-card-head"><span>Aktiver Zugangscode</span><span className="access-code-role-badge">{role}</span></div>
    <div className="access-code-value"><strong>{code}</strong><button type="button" onClick={copy} disabled={expired} aria-label="Zugangscode kopieren">{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Kopiert" : "Kopieren"}</button></div>
    <div className="access-code-lifetime"><div><HourglassMedium size={16} /><span>{remainingLabel(remainingSeconds)}</span></div><small>Gültig bis {new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(expiresAt))} Uhr</small></div>
    <div className="access-code-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    <p>{expired ? "Dieser Code kann nicht mehr verwendet werden." : "Teile den Code nur mit Personen, die dieser Organisation beitreten sollen."}</p>
  </div>
}
