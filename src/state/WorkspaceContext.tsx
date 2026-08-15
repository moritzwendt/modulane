import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type {
  Feature,
  FeatureInput,
  FeatureMember,
  FeatureStatus,
  Health,
  Priority,
  Project,
  ProjectInput,
  Requirement,
  Update,
  WorkspaceData,
} from "../domain/types"
import { localWorkspaceRepository } from "../services/workspaceStorage"

interface WorkspaceContextValue extends WorkspaceData {
  createProject(input: ProjectInput): Project
  createFeature(input: FeatureInput): Feature
  updateFeature(featureId: string, updates: Partial<Feature>): void
  toggleRequirement(featureId: string, requirementId: string): void
  addRequirement(featureId: string, title: string): void
  addUpdate(featureId: string, message: string, health: Health): void
  setFeatureMembers(featureId: string, members: FeatureMember[]): void
  setCurrentUser(userId: string): void
  resetDemo(): void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

const projectCode = (project: Project, features: Feature[]) => {
  const letters = project.name.replace(/[^A-Za-zÄÖÜäöüß]/g, "").slice(0, 3).toUpperCase()
  const count = features.filter((feature) => feature.projectId === project.id).length + 1
  return `${letters || "MOD"} ${String(count).padStart(2, "0")}`
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => localWorkspaceRepository.load())

  useEffect(() => {
    localWorkspaceRepository.save(data)
  }, [data])

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...data,
    createProject(input) {
      const project: Project = {
        id: createId("project"),
        name: input.name,
        description: input.description,
        type: input.type,
        platforms: input.platforms,
        status: "Aktiv",
        color: input.color,
        icon: input.name.trim().slice(0, 1).toUpperCase(),
        memberIds: input.memberIds,
        createdAt: new Date().toISOString(),
      }
      setData((current) => ({ ...current, projects: [...current.projects, project] }))
      return project
    },
    createFeature(input) {
      const project = data.projects.find((item) => item.id === input.projectId)
      if (!project) throw new Error("Projekt wurde nicht gefunden")
      const feature: Feature = {
        id: createId("feature"),
        projectId: input.projectId,
        key: projectCode(project, data.features),
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        health: "Im Plan",
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: input.targetDate,
        estimate: "Noch offen",
        members: input.memberIds.map((userId, index) => ({
          userId,
          role: index === 0 ? "Lead" : "Beteiligte",
        })),
        requirements: [],
        updates: [],
        createdAt: new Date().toISOString(),
      }
      setData((current) => ({ ...current, features: [...current.features, feature] }))
      return feature
    },
    updateFeature(featureId, updates) {
      setData((current) => ({
        ...current,
        features: current.features.map((feature) => feature.id === featureId ? { ...feature, ...updates } : feature),
      }))
    },
    toggleRequirement(featureId, requirementId) {
      setData((current) => ({
        ...current,
        features: current.features.map((feature) => feature.id === featureId
          ? {
              ...feature,
              requirements: feature.requirements.map((requirement) => requirement.id === requirementId
                ? { ...requirement, completed: !requirement.completed }
                : requirement),
            }
          : feature),
      }))
    },
    addRequirement(featureId, title) {
      const requirement: Requirement = { id: createId("requirement"), title, completed: false }
      setData((current) => ({
        ...current,
        features: current.features.map((feature) => feature.id === featureId
          ? { ...feature, requirements: [...feature.requirements, requirement] }
          : feature),
      }))
    },
    addUpdate(featureId, message, health) {
      const update: Update = {
        id: createId("update"),
        authorId: data.currentUserId,
        message,
        health,
        createdAt: new Date().toISOString(),
      }
      setData((current) => ({
        ...current,
        features: current.features.map((feature) => feature.id === featureId
          ? { ...feature, health, updates: [update, ...feature.updates] }
          : feature),
      }))
    },
    setFeatureMembers(featureId, members) {
      setData((current) => ({
        ...current,
        features: current.features.map((feature) => feature.id === featureId ? { ...feature, members } : feature),
      }))
    },
    setCurrentUser(userId) {
      setData((current) => ({ ...current, currentUserId: userId }))
    },
    resetDemo() {
      setData(localWorkspaceRepository.reset())
    },
  }), [data])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error("useWorkspace muss innerhalb des WorkspaceProvider verwendet werden")
  return context
}

export const featureStatuses: FeatureStatus[] = ["Idee", "Geplant", "Bereit", "In Arbeit", "Im Review", "Blockiert", "Fertig"]
export const priorities: Priority[] = ["Dringend", "Hoch", "Normal", "Niedrig", "Keine"]
