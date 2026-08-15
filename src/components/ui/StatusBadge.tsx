import type { FeatureStatus, Health, Priority, ProjectStatus } from "../../domain/types"

type BadgeValue = FeatureStatus | Health | Priority | ProjectStatus

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
}

export function StatusBadge({ value }: { value: BadgeValue }) {
  return <span className={`status-badge status-${toneByValue[value] ?? "neutral"}`}>{value}</span>
}
