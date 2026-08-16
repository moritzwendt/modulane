import type { JoinCodeRole } from "../../domain/types"
import { joinCodeRoles } from "../../state/WorkspaceContext"

const roleDetails = {
  Administrator: "Kann Projekte, Personen und Einstellungen verwalten.",
  Mitglied: "Kann Projekte und Features erstellen und bearbeiten.",
  Gast: "Erhält eingeschränkten Zugriff auf zugewiesene Inhalte.",
} satisfies Record<JoinCodeRole, string>

export function AccessCodeRolePicker({ value, onChange, compact = false }: { value: JoinCodeRole; onChange(role: JoinCodeRole): void; compact?: boolean }) {
  return <fieldset className={`access-role-picker${compact ? " compact" : ""}`}><legend>Rolle beim Beitritt</legend><div>{joinCodeRoles.map((role) => <label key={role} className={value === role ? "selected" : ""}><input type="radio" name={compact ? "initial-access-role" : "access-role"} value={role} checked={value === role} onChange={() => onChange(role)} /><span className="access-role-copy"><strong>{role}</strong><small>{roleDetails[role]}</small></span><span className="access-role-check"><CheckMark /></span></label>)}</div></fieldset>
}

function CheckMark() {
  return <span aria-hidden="true" />
}
