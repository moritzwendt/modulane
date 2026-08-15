import { demoData } from "../data/demo"
import type { WorkspaceData } from "../domain/types"

const storageKey = "modulane.workspace.v2"

export interface WorkspaceRepository {
  load(): WorkspaceData
  save(data: WorkspaceData): void
  reset(): WorkspaceData
}

const cloneDemoData = () => JSON.parse(JSON.stringify(demoData)) as WorkspaceData

export const localWorkspaceRepository: WorkspaceRepository = {
  load() {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return cloneDemoData()

    try {
      return JSON.parse(saved) as WorkspaceData
    } catch {
      return cloneDemoData()
    }
  },
  save(data) {
    window.localStorage.setItem(storageKey, JSON.stringify(data))
  },
  reset() {
    const data = cloneDemoData()
    window.localStorage.setItem(storageKey, JSON.stringify(data))
    return data
  },
}
