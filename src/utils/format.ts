import type { Feature } from "../domain/types"

export function featureProgress(feature: Feature) {
  if (!feature.requirements.length) return 0
  return Math.round((feature.requirements.filter((item) => item.completed).length / feature.requirements.length) * 100)
}

export function formatDate(value: string) {
  if (!value) return "Nicht festgelegt"
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`))
}

export function relativeDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  const difference = Math.round((date.getTime() - now.getTime()) / 86400000)
  const formatter = new Intl.RelativeTimeFormat("de", { numeric: "auto" })
  if (Math.abs(difference) < 1) return "heute"
  return formatter.format(difference, "day")
}
