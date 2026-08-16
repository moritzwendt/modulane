import type { JoinCodeRole } from "../../domain/types"
import { joinCodeRoles, roleLabels } from "../../domain/permissions"

const roleDetails = {
  admin: "Kann Mitglieder und die tägliche Organisation verwalten.",
  member: "Kann Aufgaben und Komponenten erstellen und bearbeiten.",
  guest: "Erhält Zugriff ausschließlich auf zugewiesene Projekte.",
} satisfies Record<JoinCodeRole, string>

export function AccessCodeRolePicker({ value, onChange, roles = [...joinCodeRoles], compact = false }: { value: JoinCodeRole; onChange(role: JoinCodeRole): void; roles?: JoinCodeRole[]; compact?: boolean }) {
  return <fieldset className={`access-role-picker${compact ? " compact" : ""}`}><legend>Rolle beim Beitritt</legend><div>{roles.map((role) => <label key={role} className={value === role ? "selected" : ""}><input type="radio" name={compact ? "initial-access-role" : "access-role"} value={role} checked={value === role} onChange={() => onChange(role)} /><span className="access-role-copy"><strong>{roleLabels[role]}</strong><small>{roleDetails[role]}</small></span><span className="access-role-check"><CheckMark /></span></label>)}</div></fieldset>
}

function CheckMark() {
  return <span aria-hidden="true" />
}
