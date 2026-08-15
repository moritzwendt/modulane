export function ProgressRing({ value, size = 36 }: { value: number; size?: number }) {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <span className="progress-ring" style={{ width: size, height: size }} aria-label={`${value} Prozent abgeschlossen`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="progress-track" cx="18" cy="18" r={radius} />
        <circle className="progress-value" cx="18" cy="18" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span>{value}</span>
    </span>
  )
}
