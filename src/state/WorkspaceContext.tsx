import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type {
  AccessCodeResult,
  AppPart,
  AppPartInput,
  CommitInput,
  Feature,
  FeatureInput,
  FeatureMember,
  FeatureStatus,
  Health,
  JoinCodeRole,
  Priority,
  Project,
  ProjectInput,
  ProjectStatus,
  Requirement,
  Update,
  UserInput,
  UserRole,
  WorkspaceData,
  WorkspaceSettings,
} from "../domain/types"
import { joinCodeRoles } from "../domain/permissions"
import { supabase } from "../lib/supabase"
import { initialsForName, prepareSquarePng } from "../utils/identityImage"
import { useAuth } from "./AuthContext"

interface WorkspaceContextValue extends WorkspaceData {
  workspaceId: string
  loading: boolean
  error: string
  reload(): Promise<void>
  createWorkspace(name: string, role: JoinCodeRole): Promise<AccessCodeResult & { workspaceName: string }>
  joinWorkspace(code: string): Promise<{ workspaceName: string }>
  rotateWorkspaceCode(role: JoinCodeRole): Promise<AccessCodeResult>
  createProject(input: ProjectInput): Promise<Project>
  createFeature(input: FeatureInput): Promise<Feature>
  createAppPart(input: AppPartInput): Promise<AppPart>
  updateProject(projectId: string, updates: Partial<Project>): Promise<void>
  updateWorkspaceSettings(updates: Partial<WorkspaceSettings>): Promise<void>
  updateFeature(featureId: string, updates: Partial<Feature>): Promise<void>
  toggleRequirement(featureId: string, requirementId: string): Promise<void>
  addRequirement(featureId: string, title: string): Promise<void>
  addUpdate(featureId: string, message: string, health: Health): Promise<void>
  setFeatureMembers(featureId: string, members: FeatureMember[]): Promise<void>
  updateAppPart(appPartId: string, updates: Partial<AppPart>): Promise<void>
  claimAppPart(appPartId: string): Promise<void>
  setActiveAppPartUsers(appPartId: string, userIds: string[]): Promise<void>
  addAppPartCommit(appPartId: string, input: CommitInput): Promise<void>
  inviteUser(input: UserInput): Promise<void>
  updateUserRole(userId: string, role: UserRole): Promise<void>
  removeUser(userId: string): Promise<void>
  updateUser(userId: string, updates: Partial<UserInput>): Promise<void>
  uploadUserAvatar(file: File): Promise<string>
  uploadOrganizationLogo(file: File): Promise<string>
}

const emptySettings: WorkspaceSettings = {
  name: "",
  logoUrl: "",
  slug: "",
  visibility: "Nur auf Einladung",
  allowMemberInvites: false,
  emailNotifications: true,
  weeklyDigest: true,
  defaultProjectStatus: "Geplant",
}

const emptyData: WorkspaceData = {
  users: [],
  projects: [],
  features: [],
  appParts: [],
  currentUserId: "",
  settings: emptySettings,
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const projectCode = (project: Project, features: Feature[]) => {
  const count = features.filter((feature) => feature.projectId === project.id).length + 1
  return `${project.featurePrefix || "MOD"} ${String(count).padStart(2, "0")}`
}

const appPartCode = (project: Project, appParts: AppPart[]) => {
  const count = appParts.filter((appPart) => appPart.projectId === project.id).length + 1
  return `${project.featurePrefix || "MOD"} P${String(count).padStart(2, "0")}`
}

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

const edgeFunctionErrorMessage = async (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "context" in error && error.context instanceof Response) {
    try {
      const body = await error.context.clone().json()
      if (body && typeof body.error === "string") return body.error
    } catch {
      return "message" in error && typeof error.message === "string" ? error.message : fallback
    }
  }
  return error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : fallback
}

export { joinCodeRoles }

const isUnauthorizedFunctionError = (error: unknown) => error && typeof error === "object" && "context" in error && error.context instanceof Response && error.context.status === 401

const invokeWorkspaceOnboarding = async (body: Record<string, unknown>) => {
  const sessionResult = await supabase.auth.getSession()
  if (sessionResult.error || !sessionResult.data.session) throw new Error("Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.")

  let session = sessionResult.data.session
  if (session.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.error || !refreshed.data.session) throw new Error("Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.")
    session = refreshed.data.session
  }

  const invoke = (accessToken: string) => supabase.functions.invoke("workspace-onboarding", {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  let result = await invoke(session.access_token)
  if (result.error && isUnauthorizedFunctionError(result.error)) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.error || !refreshed.data.session) throw new Error("Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.")
    result = await invoke(refreshed.data.session.access_token)
  }
  if (result.error && isUnauthorizedFunctionError(result.error)) throw new Error("Deine Anmeldung konnte nicht bestätigt werden. Bitte melde dich erneut an.")
  return result
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<WorkspaceData>(emptyData)
  const [workspaceId, setWorkspaceId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (!user) {
      setData(emptyData)
      setWorkspaceId("")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const membershipResult = await supabase.from("workspace_members").select("workspace_id, role").eq("user_id", user.id).order("joined_at").limit(1).maybeSingle()
      throwIfError(membershipResult.error)
      if (!membershipResult.data) {
        setData({ ...emptyData, currentUserId: user.id })
        setWorkspaceId("")
        return
      }
      const activeWorkspaceId = membershipResult.data.workspace_id
      const [workspaceResult, membersResult, projectsResult] = await Promise.all([
        supabase.from("workspaces").select("*").eq("id", activeWorkspaceId).single(),
        supabase.from("workspace_members").select("user_id, role, joined_at").eq("workspace_id", activeWorkspaceId),
        supabase.from("projects").select("*").eq("workspace_id", activeWorkspaceId).order("created_at"),
      ])
      throwIfError(workspaceResult.error)
      throwIfError(membersResult.error)
      throwIfError(projectsResult.error)
      const memberRows = membersResult.data ?? []
      const projectRows = projectsResult.data ?? []
      const memberIds = memberRows.map((item) => item.user_id)
      const projectIds = projectRows.map((item) => item.id)
      const [profilesResult, projectMembersResult, appPartsResult, featuresResult] = await Promise.all([
        memberIds.length ? supabase.from("profiles").select("*").in("id", memberIds) : Promise.resolve({ data: [], error: null }),
        projectIds.length ? supabase.from("project_members").select("project_id, user_id").in("project_id", projectIds) : Promise.resolve({ data: [], error: null }),
        projectIds.length ? supabase.from("app_parts").select("*").in("project_id", projectIds).order("created_at") : Promise.resolve({ data: [], error: null }),
        projectIds.length ? supabase.from("features").select("*").in("project_id", projectIds).order("created_at") : Promise.resolve({ data: [], error: null }),
      ])
      throwIfError(profilesResult.error)
      throwIfError(projectMembersResult.error)
      throwIfError(appPartsResult.error)
      throwIfError(featuresResult.error)
      const profileRows = profilesResult.data ?? []
      const projectMemberRows = projectMembersResult.data ?? []
      const appPartRows = appPartsResult.data ?? []
      const featureRows = featuresResult.data ?? []
      const appPartIds = appPartRows.map((item) => item.id)
      const featureIds = featureRows.map((item) => item.id)
      const [activeUsersResult, commitsResult, featureMembersResult, featureAppPartsResult, requirementsResult, updatesResult] = await Promise.all([
        appPartIds.length ? supabase.from("app_part_active_users").select("app_part_id, user_id").in("app_part_id", appPartIds) : Promise.resolve({ data: [], error: null }),
        appPartIds.length ? supabase.from("app_part_commits").select("*").in("app_part_id", appPartIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
        featureIds.length ? supabase.from("feature_members").select("feature_id, user_id, role").in("feature_id", featureIds) : Promise.resolve({ data: [], error: null }),
        featureIds.length ? supabase.from("feature_app_parts").select("feature_id, app_part_id").in("feature_id", featureIds) : Promise.resolve({ data: [], error: null }),
        featureIds.length ? supabase.from("requirements").select("*").in("feature_id", featureIds).order("created_at") : Promise.resolve({ data: [], error: null }),
        featureIds.length ? supabase.from("feature_updates").select("*").in("feature_id", featureIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      ])
      ;[activeUsersResult, commitsResult, featureMembersResult, featureAppPartsResult, requirementsResult, updatesResult].forEach((result) => throwIfError(result.error))
      const activeUserRows = activeUsersResult.data ?? []
      const commitRows = commitsResult.data ?? []
      const featureMemberRows = featureMembersResult.data ?? []
      const featureAppPartRows = featureAppPartsResult.data ?? []
      const requirementRows = requirementsResult.data ?? []
      const updateRows = updatesResult.data ?? []
      const roleByUser = new Map(memberRows.map((item) => [item.user_id, item.role]))
      const users = profileRows.map((profile) => ({
        id: profile.id,
        name: profile.name,
        firstName: profile.first_name,
        lastName: profile.last_name,
        handle: profile.handle,
        email: profile.email,
        initials: profile.initials,
        color: profile.color,
        avatarUrl: profile.avatar_url,
        role: roleByUser.get(profile.id) as UserRole,
        jobTitle: profile.job_title,
        lastActiveAt: profile.last_active_at,
      }))
      const projects: Project[] = projectRows.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        platforms: project.platforms,
        status: project.status,
        color: project.color,
        icon: project.icon,
        memberIds: projectMemberRows.filter((item) => item.project_id === project.id).map((item) => item.user_id),
        visibility: project.visibility,
        featurePrefix: project.feature_prefix,
        repositoryName: project.repository_name,
        autoArchiveDone: project.auto_archive_done,
        createdAt: project.created_at,
      }))
      const appParts: AppPart[] = appPartRows.map((part) => ({
        id: part.id,
        projectId: part.project_id,
        key: part.key,
        name: part.name,
        description: part.description,
        platform: part.platform,
        releaseState: part.release_state,
        ownerUserId: part.owner_user_id ?? "",
        activeUserIds: activeUserRows.filter((item) => item.app_part_id === part.id).map((item) => item.user_id),
        commits: commitRows.filter((item) => item.app_part_id === part.id).map((item) => ({ id: item.id, hash: item.hash, message: item.message, branch: item.branch, authorId: item.author_id, createdAt: item.created_at, url: item.url })),
        createdAt: part.created_at,
      }))
      const features: Feature[] = featureRows.map((feature) => ({
        id: feature.id,
        projectId: feature.project_id,
        key: feature.key,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        priority: feature.priority,
        health: feature.health,
        appPartIds: featureAppPartRows.filter((item) => item.feature_id === feature.id).map((item) => item.app_part_id),
        startDate: feature.start_date ?? "",
        targetDate: feature.target_date ?? "",
        estimate: feature.estimate,
        members: featureMemberRows.filter((item) => item.feature_id === feature.id).map((item) => ({ userId: item.user_id, role: item.role })),
        requirements: requirementRows.filter((item) => item.feature_id === feature.id).map((item) => ({ id: item.id, title: item.title, completed: item.completed })),
        updates: updateRows.filter((item) => item.feature_id === feature.id).map((item) => ({ id: item.id, authorId: item.author_id, message: item.message, health: item.health, createdAt: item.created_at })),
        createdAt: feature.created_at,
      }))
      setWorkspaceId(activeWorkspaceId)
      setData({
        users,
        projects,
        appParts,
        features,
        currentUserId: user.id,
        settings: {
          name: workspaceResult.data.name,
          logoUrl: workspaceResult.data.logo_url,
          slug: workspaceResult.data.slug,
          visibility: workspaceResult.data.visibility,
          allowMemberInvites: workspaceResult.data.allow_member_invites,
          emailNotifications: workspaceResult.data.email_notifications,
          weeklyDigest: workspaceResult.data.weekly_digest,
          defaultProjectStatus: workspaceResult.data.default_project_status,
        },
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Organisation konnte nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAuthenticated) void reload()
      else {
        setData(emptyData)
        setWorkspaceId("")
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, reload])

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...data,
    workspaceId,
    loading,
    error,
    reload,
    async createWorkspace(name, role) {
      const { data: result, error: functionError } = await invokeWorkspaceOnboarding({ action: "create", name, role })
      if (functionError) throw new Error(await edgeFunctionErrorMessage(functionError, "Organisation konnte nicht erstellt werden."))
      if (result?.error) throw new Error(result.error)
      return { code: result.code, workspaceName: result.workspaceName, role: result.role, expiresAt: result.expiresAt }
    },
    async joinWorkspace(code) {
      const { data: result, error: functionError } = await invokeWorkspaceOnboarding({ action: "join", code })
      if (functionError) throw new Error(await edgeFunctionErrorMessage(functionError, "Organisation konnte nicht gefunden werden."))
      if (result?.error) throw new Error(result.error)
      await reload()
      return { workspaceName: result.workspaceName }
    },
    async rotateWorkspaceCode(role) {
      const { data: result, error: functionError } = await invokeWorkspaceOnboarding({ action: "rotate", workspaceId, role })
      if (functionError) throw new Error(await edgeFunctionErrorMessage(functionError, "Zugangscode konnte nicht erstellt werden."))
      if (result?.error) throw new Error(result.error)
      return { code: result.code, role: result.role, expiresAt: result.expiresAt }
    },
    async createProject(input) {
      if (!user || !workspaceId) throw new Error("Die Organisation ist nicht bereit.")
      const id = crypto.randomUUID()
      const prefix = input.name.replace(/[^A-Za-zÄÖÜäöüß]/g, "").slice(0, 3).toUpperCase() || "MOD"
      const project: Project = { id, name: input.name, description: input.description, type: input.type, platforms: input.platforms, status: data.settings.defaultProjectStatus, color: input.color, icon: input.name.trim().slice(0, 1).toUpperCase(), memberIds: input.memberIds, visibility: "Workspace", featurePrefix: prefix, repositoryName: "", autoArchiveDone: false, createdAt: new Date().toISOString() }
      const projectResult = await supabase.from("projects").insert({ id, workspace_id: workspaceId, name: project.name, description: project.description, type: project.type, platforms: project.platforms, status: project.status, color: project.color, icon: project.icon, visibility: project.visibility, feature_prefix: project.featurePrefix, repository_name: "", auto_archive_done: false, created_by: user.id })
      throwIfError(projectResult.error)
      const memberIds = Array.from(new Set([user.id, ...input.memberIds]))
      const memberResult = await supabase.from("project_members").insert(memberIds.map((userId) => ({ project_id: id, user_id: userId })))
      throwIfError(memberResult.error)
      project.memberIds = memberIds
      setData((current) => ({ ...current, projects: [...current.projects, project] }))
      return project
    },
    async createFeature(input) {
      if (!user) throw new Error("Du bist nicht angemeldet.")
      const project = data.projects.find((item) => item.id === input.projectId)
      if (!project) throw new Error("Projekt wurde nicht gefunden.")
      const feature: Feature = { id: crypto.randomUUID(), projectId: input.projectId, key: projectCode(project, data.features), title: input.title, description: input.description, status: input.status, priority: input.priority, health: "Im Plan", appPartIds: input.appPartIds, startDate: new Date().toISOString().slice(0, 10), targetDate: input.targetDate, estimate: "Noch offen", members: input.memberIds.map((userId, index) => ({ userId, role: index === 0 ? "Lead" : "Beteiligte" })), requirements: [], updates: [], createdAt: new Date().toISOString() }
      const featureResult = await supabase.from("features").insert({ id: feature.id, project_id: feature.projectId, key: feature.key, title: feature.title, description: feature.description, status: feature.status, priority: feature.priority, health: feature.health, start_date: feature.startDate, target_date: feature.targetDate || null, estimate: feature.estimate, created_by: user.id })
      throwIfError(featureResult.error)
      const membersResult = await supabase.from("feature_members").insert(feature.members.map((member) => ({ feature_id: feature.id, user_id: member.userId, role: member.role })))
      throwIfError(membersResult.error)
      if (feature.appPartIds.length) throwIfError((await supabase.from("feature_app_parts").insert(feature.appPartIds.map((appPartId) => ({ feature_id: feature.id, app_part_id: appPartId })))).error)
      setData((current) => ({ ...current, features: [...current.features, feature] }))
      return feature
    },
    async createAppPart(input) {
      if (!user) throw new Error("Du bist nicht angemeldet.")
      const project = data.projects.find((item) => item.id === input.projectId)
      if (!project) throw new Error("Projekt wurde nicht gefunden.")
      const part: AppPart = { id: crypto.randomUUID(), projectId: input.projectId, key: appPartCode(project, data.appParts), name: input.name, description: input.description, platform: input.platform, releaseState: input.releaseState, ownerUserId: input.ownerUserId, activeUserIds: input.ownerUserId ? [input.ownerUserId] : [], commits: [], createdAt: new Date().toISOString() }
      const partResult = await supabase.from("app_parts").insert({ id: part.id, project_id: part.projectId, key: part.key, name: part.name, description: part.description, platform: part.platform, release_state: part.releaseState, owner_user_id: part.ownerUserId || null, created_by: user.id })
      throwIfError(partResult.error)
      if (part.ownerUserId) throwIfError((await supabase.from("app_part_active_users").insert({ app_part_id: part.id, user_id: part.ownerUserId })).error)
      setData((current) => ({ ...current, appParts: [...current.appParts, part] }))
      return part
    },
    async updateProject(projectId, updates) {
      const payload = { name: updates.name, description: updates.description, type: updates.type, platforms: updates.platforms, status: updates.status, color: updates.color, icon: updates.icon, visibility: updates.visibility, feature_prefix: updates.featurePrefix, repository_name: updates.repositoryName, auto_archive_done: updates.autoArchiveDone }
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
      throwIfError((await supabase.from("projects").update(cleaned).eq("id", projectId)).error)
      if (updates.memberIds) {
        const existingIds = data.projects.find((project) => project.id === projectId)?.memberIds ?? []
        const memberIds = Array.from(new Set([...(user ? [user.id] : []), ...updates.memberIds]))
        const addedIds = memberIds.filter((userId) => !existingIds.includes(userId))
        const removedIds = existingIds.filter((userId) => !memberIds.includes(userId))
        if (addedIds.length) throwIfError((await supabase.from("project_members").insert(addedIds.map((userId) => ({ project_id: projectId, user_id: userId })))).error)
        if (removedIds.length) throwIfError((await supabase.from("project_members").delete().eq("project_id", projectId).in("user_id", removedIds)).error)
        updates = { ...updates, memberIds }
      }
      setData((current) => ({ ...current, projects: current.projects.map((project) => project.id === projectId ? { ...project, ...updates } : project) }))
    },
    async updateWorkspaceSettings(updates) {
      const payload = { name: updates.name, logo_url: updates.logoUrl, slug: updates.slug, visibility: updates.visibility, allow_member_invites: updates.allowMemberInvites, email_notifications: updates.emailNotifications, weekly_digest: updates.weeklyDigest, default_project_status: updates.defaultProjectStatus }
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
      throwIfError((await supabase.from("workspaces").update(cleaned).eq("id", workspaceId)).error)
      setData((current) => ({ ...current, settings: { ...current.settings, ...updates } }))
    },
    async updateFeature(featureId, updates) {
      const payload = { title: updates.title, description: updates.description, status: updates.status, priority: updates.priority, health: updates.health, start_date: updates.startDate || undefined, target_date: updates.targetDate === "" ? null : updates.targetDate, estimate: updates.estimate }
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
      throwIfError((await supabase.from("features").update(cleaned).eq("id", featureId)).error)
      if (updates.appPartIds) {
        const currentIds = data.features.find((feature) => feature.id === featureId)?.appPartIds ?? []
        const appPartIds = Array.from(new Set(updates.appPartIds))
        const addedIds = appPartIds.filter((appPartId) => !currentIds.includes(appPartId))
        const removedIds = currentIds.filter((appPartId) => !appPartIds.includes(appPartId))
        if (addedIds.length) throwIfError((await supabase.from("feature_app_parts").insert(addedIds.map((appPartId) => ({ feature_id: featureId, app_part_id: appPartId })))).error)
        if (removedIds.length) throwIfError((await supabase.from("feature_app_parts").delete().eq("feature_id", featureId).in("app_part_id", removedIds)).error)
        updates = { ...updates, appPartIds }
      }
      setData((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, ...updates } : feature) }))
    },
    async toggleRequirement(featureId, requirementId) {
      const feature = data.features.find((item) => item.id === featureId)
      const requirement = feature?.requirements.find((item) => item.id === requirementId)
      if (!requirement) return
      throwIfError((await supabase.from("requirements").update({ completed: !requirement.completed }).eq("id", requirementId)).error)
      setData((current) => ({ ...current, features: current.features.map((item) => item.id === featureId ? { ...item, requirements: item.requirements.map((entry) => entry.id === requirementId ? { ...entry, completed: !entry.completed } : entry) } : item) }))
    },
    async addRequirement(featureId, title) {
      if (!user) return
      const requirement: Requirement = { id: crypto.randomUUID(), title, completed: false }
      throwIfError((await supabase.from("requirements").insert({ id: requirement.id, feature_id: featureId, title, created_by: user.id })).error)
      setData((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, requirements: [...feature.requirements, requirement] } : feature) }))
    },
    async addUpdate(featureId, message, health) {
      if (!user) return
      const update: Update = { id: crypto.randomUUID(), authorId: user.id, message, health, createdAt: new Date().toISOString() }
      throwIfError((await supabase.from("feature_updates").insert({ id: update.id, feature_id: featureId, author_id: user.id, message, health })).error)
      throwIfError((await supabase.from("features").update({ health }).eq("id", featureId)).error)
      setData((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, health, updates: [update, ...feature.updates] } : feature) }))
    },
    async setFeatureMembers(featureId, members) {
      throwIfError((await supabase.from("feature_members").delete().eq("feature_id", featureId)).error)
      if (members.length) throwIfError((await supabase.from("feature_members").insert(members.map((member) => ({ feature_id: featureId, user_id: member.userId, role: member.role })))).error)
      setData((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, members } : feature) }))
    },
    async updateAppPart(appPartId, updates) {
      const payload = { name: updates.name, description: updates.description, platform: updates.platform, release_state: updates.releaseState, owner_user_id: updates.ownerUserId === "" ? null : updates.ownerUserId }
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
      throwIfError((await supabase.from("app_parts").update(cleaned).eq("id", appPartId)).error)
      setData((current) => ({ ...current, appParts: current.appParts.map((part) => part.id === appPartId ? { ...part, ...updates } : part) }))
    },
    async claimAppPart(appPartId) {
      if (!user) return
      throwIfError((await supabase.from("app_parts").update({ owner_user_id: user.id }).eq("id", appPartId)).error)
      throwIfError((await supabase.from("app_part_active_users").upsert({ app_part_id: appPartId, user_id: user.id })).error)
      setData((current) => ({ ...current, appParts: current.appParts.map((part) => part.id === appPartId ? { ...part, ownerUserId: user.id, activeUserIds: Array.from(new Set([...part.activeUserIds, user.id])) } : part) }))
    },
    async setActiveAppPartUsers(appPartId, userIds) {
      throwIfError((await supabase.from("app_part_active_users").delete().eq("app_part_id", appPartId)).error)
      if (userIds.length) throwIfError((await supabase.from("app_part_active_users").insert(userIds.map((userId) => ({ app_part_id: appPartId, user_id: userId })))).error)
      setData((current) => ({ ...current, appParts: current.appParts.map((part) => part.id === appPartId ? { ...part, activeUserIds: userIds } : part) }))
    },
    async addAppPartCommit(appPartId, input) {
      if (!user) return
      const commit = { id: crypto.randomUUID(), ...input, authorId: user.id, createdAt: new Date().toISOString() }
      throwIfError((await supabase.from("app_part_commits").insert({ id: commit.id, app_part_id: appPartId, hash: commit.hash, message: commit.message, branch: commit.branch, author_id: user.id, url: commit.url })).error)
      setData((current) => ({ ...current, appParts: current.appParts.map((part) => part.id === appPartId ? { ...part, commits: [commit, ...part.commits] } : part) }))
    },
    async inviteUser(input) {
      const { error: functionError } = await supabase.functions.invoke("invite-member", { body: { workspaceId, ...input } })
      if (functionError) throw new Error(functionError.message)
      await reload()
    },
    async updateUserRole(userId, role) {
      throwIfError((await supabase.rpc("change_workspace_member_role", { target_workspace_id: workspaceId, target_user_id: userId, new_role: role })).error)
      setData((current) => ({ ...current, users: current.users.map((item) => item.id === userId ? { ...item, role } : item) }))
    },
    async removeUser(userId) {
      throwIfError((await supabase.rpc("remove_workspace_member", { target_workspace_id: workspaceId, target_user_id: userId })).error)
      setData((current) => ({
        ...current,
        users: current.users.filter((item) => item.id !== userId),
        projects: current.projects.map((project) => ({ ...project, memberIds: project.memberIds.filter((id) => id !== userId) })),
        features: current.features.map((feature) => ({ ...feature, members: feature.members.filter((member) => member.userId !== userId) })),
        appParts: current.appParts.map((part) => ({ ...part, activeUserIds: part.activeUserIds.filter((id) => id !== userId), ownerUserId: part.ownerUserId === userId ? "" : part.ownerUserId })),
      }))
    },
    async updateUser(userId, updates) {
      const existingUser = data.users.find((item) => item.id === userId)
      const firstName = updates.firstName?.trim() ?? existingUser?.firstName ?? ""
      const lastName = updates.lastName?.trim() ?? existingUser?.lastName ?? ""
      const name = `${firstName} ${lastName}`.trim()
      const payload = { name, first_name: firstName, last_name: lastName, initials: initialsForName(name), email: updates.email, job_title: updates.jobTitle }
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
      if (userId === user?.id && updates.email && updates.email !== user.email) throwIfError((await supabase.auth.updateUser({ email: updates.email })).error)
      delete cleaned.email
      throwIfError((await supabase.from("profiles").update(cleaned).eq("id", userId)).error)
      setData((current) => ({ ...current, users: current.users.map((item) => item.id === userId ? { ...item, ...updates, firstName, lastName, name, initials: initialsForName(name) } : item) }))
    },
    async uploadUserAvatar(file) {
      if (!user) throw new Error("Du bist nicht angemeldet.")
      const image = await prepareSquarePng(file)
      const path = `profiles/${user.id}/avatar_${Date.now()}.png`
      throwIfError((await supabase.storage.from("identity-assets").upload(path, image, { contentType: "image/png" })).error)
      const avatarUrl = supabase.storage.from("identity-assets").getPublicUrl(path).data.publicUrl
      throwIfError((await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id)).error)
      setData((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? { ...item, avatarUrl } : item) }))
      return avatarUrl
    },
    async uploadOrganizationLogo(file) {
      if (!workspaceId) throw new Error("Die Organisation ist nicht bereit.")
      const image = await prepareSquarePng(file)
      const path = `organizations/${workspaceId}/logo_${Date.now()}.png`
      throwIfError((await supabase.storage.from("identity-assets").upload(path, image, { contentType: "image/png" })).error)
      const logoUrl = supabase.storage.from("identity-assets").getPublicUrl(path).data.publicUrl
      throwIfError((await supabase.from("workspaces").update({ logo_url: logoUrl }).eq("id", workspaceId)).error)
      setData((current) => ({ ...current, settings: { ...current.settings, logoUrl } }))
      return logoUrl
    },
  }), [data, error, loading, reload, user, workspaceId])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error("useWorkspace muss innerhalb des WorkspaceProvider verwendet werden")
  return context
}

export const featureStatuses: FeatureStatus[] = ["Idee", "Geplant", "Bereit", "In Arbeit", "Im Review", "Blockiert", "Fertig"]
export const priorities: Priority[] = ["Dringend", "Hoch", "Normal", "Niedrig", "Keine"]
export const releaseStates = ["Frei", "In Entwicklung", "Instabil", "Stabil", "Production Ready"] as const
export const projectStatuses: ProjectStatus[] = ["Geplant", "Aktiv", "Pausiert", "Abgeschlossen"]
