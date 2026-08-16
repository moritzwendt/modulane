import { Eye, ShieldCheck, User } from "@phosphor-icons/react"
import type { JoinCodeRole } from "../../domain/types"
import { joinCodeRoles } from "../../state/WorkspaceContext"

const roleDetails = {
  Administrator: { icon: ShieldCheck, description: "Kann Projekte, Personen und Einstellungen verwalten." },
  Mitglied: { icon: User, description: "Kann Projekte und Features erstellen und bearbeiten." },
  Gast: { icon: Eye, description: "Erhält eingeschränkten Zugriff auf zugewiesene Inhalte." },
} satisfies Record<JoinCodeRole, { icon: typeof ShieldCheck; description: string }>

export function AccessCodeRolePicker({ value, onChange, compact = false }: { value: JoinCodeRole; onChange(role: JoinCodeRole): void; compact?: boolean }) {
  return <fieldset className={`access-role-picker${compact ? " compact" : ""}`}><legend>Rolle beim Beitritt</legend><div>{joinCodeRoles.map((role) => { const detail = roleDetails[role]; const Icon = detail.icon; return <label key={role} className={value === role ? "selected" : ""}><input type="radio" name={compact ? "initial-access-role" : "access-role"} value={role} checked={value === role} onChange={() => onChange(role)} /><span className="access-role-icon"><Icon size={17} /></span><span><strong>{role}</strong><small>{detail.description}</small></span><span className="access-role-check"><CheckMark /></span></label> })}</div></fieldset>
}

function CheckMark() {
  return <span aria-hidden="true" />
}
