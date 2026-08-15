export type ProjectType =
  | "Mobile App"
  | "Web App"
  | "Desktop App"
  | "Website"
  | "Backend"
  | "API"
  | "Bibliothek"
  | "Browser Erweiterung"
  | "Internes Tool"
  | "Anderes"

export type ProjectStatus = "Geplant" | "Aktiv" | "Pausiert" | "Abgeschlossen"

export type FeatureStatus =
  | "Idee"
  | "Geplant"
  | "Bereit"
  | "In Arbeit"
  | "Im Review"
  | "Blockiert"
  | "Fertig"

export type Priority = "Dringend" | "Hoch" | "Normal" | "Niedrig" | "Keine"
export type Health = "Im Plan" | "Gefährdet" | "Blockiert"
export type FeatureRole = "Lead" | "Beteiligte" | "Review"

export interface User {
  id: string
  name: string
  handle: string
  email: string
  initials: string
  color: string
  role: "Eigentümer" | "Administrator" | "Mitglied"
}

export interface FeatureMember {
  userId: string
  role: FeatureRole
}

export interface Requirement {
  id: string
  title: string
  completed: boolean
}

export interface Update {
  id: string
  authorId: string
  message: string
  createdAt: string
  health: Health
}

export interface Feature {
  id: string
  projectId: string
  key: string
  title: string
  description: string
  status: FeatureStatus
  priority: Priority
  health: Health
  startDate: string
  targetDate: string
  estimate: string
  members: FeatureMember[]
  requirements: Requirement[]
  updates: Update[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  type: ProjectType
  platforms: string[]
  status: ProjectStatus
  color: string
  icon: string
  memberIds: string[]
  createdAt: string
}

export interface WorkspaceData {
  users: User[]
  projects: Project[]
  features: Feature[]
  currentUserId: string
}

export interface ProjectInput {
  name: string
  description: string
  type: ProjectType
  platforms: string[]
  memberIds: string[]
  color: string
}

export interface FeatureInput {
  projectId: string
  title: string
  description: string
  status: FeatureStatus
  priority: Priority
  targetDate: string
  memberIds: string[]
}
