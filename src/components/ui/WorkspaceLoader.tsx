import { CirclesFour } from "@phosphor-icons/react"

type WorkspaceLoaderProps = {
  label?: string
}

export function WorkspaceLoader({ label = "Workspace wird geladen" }: WorkspaceLoaderProps) {
  return (
    <main className="workspace-loader" role="status" aria-live="polite">
      <section className="workspace-loader-card">
        <div className="workspace-loader-brand">
          <span><CirclesFour size={18} weight="fill" /></span>
          <strong>Modulane</strong>
        </div>
        <div className="workspace-loader-preview" aria-hidden="true">
          <div className="workspace-loader-sidebar">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="workspace-loader-content">
            <span className="workspace-loader-heading" />
            <div className="workspace-loader-row"><span /><span /></div>
            <div className="workspace-loader-row"><span /><span /></div>
            <div className="workspace-loader-row"><span /><span /></div>
          </div>
        </div>
        <div className="workspace-loader-status">
          <span>{label}</span>
          <span className="workspace-loader-dots" aria-hidden="true"><i /><i /><i /></span>
        </div>
      </section>
    </main>
  )
}
