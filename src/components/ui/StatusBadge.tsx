import type { FeatureStatus, Health, Priority, ProjectStatus, ReleaseState } from "../../domain/types"

type BadgeValue = FeatureStatus | Health | Priority | ProjectStatus | ReleaseState

const toneByValue: Record<string, string> = {
  Idee: "neutral",
  Geplant: "neutral",
  Bereit: "blue",
  "In Arbeit": "violet",
  "Im Review": "amber",
  Blockiert: "red",
  Fertig: "green",
  Aktiv: "green",
  Pausiert: "amber",
  Abgeschlossen: "neutral",
  Dringend: "red",
  Hoch: "amber",
  Normal: "blue",
  Niedrig: "neutral",
  Keine: "neutral",
  "Im Plan": "green",
  Gefährdet: "amber",
  Frei: "neutral",
  "In Entwicklung": "violet",
  Instabil: "red",
  Stabil: "blue",
  "Production Ready": "green",
}

export function StatusBadge({ value }: { value: BadgeValue }) {
  return <span className={`status-badge status-${toneByValue[value] ?? "neutral"}`}>{value}</span>
}
