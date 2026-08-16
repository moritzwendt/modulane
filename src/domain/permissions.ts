import type { Project, UserRole, WorkspaceSettings } from "./types"

export const organizationRoles: UserRole[] = ["owner", "admin", "member", "guest"]
export const joinCodeRoles = ["admin", "member", "guest"] as const

export const roleLabels: Record<UserRole, string> = {
  owner: "Eigentümer",
  admin: "Administrator",
  member: "Mitglied",
  guest: "Gast",
}

export const roleDescriptions: Record<UserRole, string> = {
  owner: "Vollständige Kontrolle über Organisation und Sicherheit",
  admin: "Verwaltet Projekte, Mitglieder und tägliche Einstellungen",
  member: "Bearbeitet Aufgaben und arbeitet an Komponenten",
  guest: "Arbeitet ausschließlich in zugewiesenen Projekten",
}

export function organizationPermissions(role: UserRole, settings: WorkspaceSettings) {
  return {
    canManageSecurity: role === "owner",
    canManageOrganization: role === "owner" || role === "admin",
    canCreateProjects: role === "owner" || role === "admin",
    canCreateComponents: role === "owner" || role === "admin" || role === "member",
    canInvitePeople: role === "owner" || role === "admin" || (role === "member" && settings.allowMemberInvites),
    canCreateAccessCodes: role === "owner" || role === "admin",
    canViewTeam: role !== "guest",
  }
}

export function canManageMember(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "owner") return true
  return actorRole === "admin" && (targetRole === "member" || targetRole === "guest")
}

export function assignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "owner") return organizationRoles
  if (actorRole === "admin") return ["member", "guest"]
  return []
}

export function invitableRoles(actorRole: UserRole): Exclude<UserRole, "owner">[] {
  if (actorRole === "owner") return ["admin", "member", "guest"]
  if (actorRole === "admin" || actorRole === "member") return ["member", "guest"]
  return []
}

export function canContributeToProject(role: UserRole, project: Project, userId: string) {
  if (role === "owner" || role === "admin") return true
  if (role === "guest") return project.memberIds.includes(userId)
  return project.visibility === "Workspace" || project.memberIds.includes(userId)
}
