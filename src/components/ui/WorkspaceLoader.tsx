type WorkspaceLoaderProps = {
  label?: string
}

export function WorkspaceLoader({ label = "Organisation wird geladen" }: WorkspaceLoaderProps) {
  return (
    <main className="workspace-loader" role="status" aria-label={label}>
      <span className="workspace-spinner" aria-hidden="true" />
    </main>
  )
}
