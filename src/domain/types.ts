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
export type UserRole = "Eigentümer" | "Administrator" | "Mitglied" | "Gast"
export type ReleaseState = "Frei" | "In Entwicklung" | "Instabil" | "Stabil" | "Production Ready"
export type WorkspaceVisibility = "Nur auf Einladung" | "Offen für die Organisation"
export type ProjectVisibility = "Workspace" | "Privat"

export interface User {
  id: string
  name: string
  handle: string
  email: string
  initials: string
  color: string
  role: UserRole
  jobTitle: string
  lastActiveAt: string
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

export interface FeatureCommit {
  id: string
  hash: string
  message: string
  branch: string
  authorId: string
  createdAt: string
  url: string
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
  appPartId: string
  startDate: string
  targetDate: string
  estimate: string
  members: FeatureMember[]
  requirements: Requirement[]
  updates: Update[]
  createdAt: string
}

export interface AppPart {
  id: string
  projectId: string
  key: string
  name: string
  description: string
  platform: string
  releaseState: ReleaseState
  ownerUserId: string
  activeUserIds: string[]
  commits: FeatureCommit[]
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
  visibility: ProjectVisibility
  featurePrefix: string
  repositoryName: string
  autoArchiveDone: boolean
  createdAt: string
}

export interface WorkspaceSettings {
  name: string
  slug: string
  visibility: WorkspaceVisibility
  allowMemberInvites: boolean
  emailNotifications: boolean
  weeklyDigest: boolean
  defaultProjectStatus: ProjectStatus
}

export interface WorkspaceData {
  users: User[]
  projects: Project[]
  features: Feature[]
  appParts: AppPart[]
  currentUserId: string
  settings: WorkspaceSettings
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
  appPartId: string
}

export interface AppPartInput {
  projectId: string
  name: string
  description: string
  platform: string
  releaseState: ReleaseState
  ownerUserId: string
}

export interface UserInput {
  name: string
  email: string
  role: UserRole
  jobTitle: string
}

export interface CommitInput {
  message: string
  hash: string
  branch: string
  authorId: string
  url: string
}
