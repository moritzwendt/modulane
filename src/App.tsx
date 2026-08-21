import { useState } from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { CreateProjectModal } from "./components/forms/CreateProjectModal"
import { AppShell } from "./components/layout/AppShell"
import { WorkspaceLoader } from "./components/ui/WorkspaceLoader"
import { useAuth } from "./state/AuthContext"
import { useWorkspace } from "./state/WorkspaceContext"
import { ForgotPasswordPage, LoginPage, RegisterPage, UpdatePasswordPage } from "./pages/AuthPages"
import { LandingPage } from "./pages/LandingPage"
import { ImprintPage, PrivacyPage, TermsPage } from "./pages/LegalPages"
import { DashboardPage } from "./pages/DashboardPage"
import { FeaturePage } from "./pages/FeaturePage"
import { MyFeaturesPage } from "./pages/MyFeaturesPage"
import { OnboardingPage } from "./pages/OnboardingPage"
import { ProjectPage } from "./pages/ProjectPage"
import { ProjectsPage } from "./pages/ProjectsPage"
import { ProjectSettingsPage } from "./pages/ProjectSettingsPage"
import { ProductPage } from "./pages/ProductPage"
import { AppPartPage } from "./pages/AppPartPage"
import { SettingsPage } from "./pages/SettingsPage"
import { TeamPage } from "./pages/TeamPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/impressum" element={<ImprintPage />} />
      <Route path="/datenschutz" element={<PrivacyPage />} />
      <Route path="/agb" element={<TermsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/*" element={<WorkspaceApp />} />
    </Routes>
  )
}

function WorkspaceApp() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const { workspaceId, currentUserId, loading: workspaceLoading, error } = useWorkspace()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  if (authLoading) return <WorkspaceLoader label="Anmeldung wird geprüft" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (currentUserId !== user?.id) return <WorkspaceLoader />
  if (workspaceLoading) return <WorkspaceLoader />
  if (error) return <div className="route-loading">{error}</div>
  if (!workspaceId) return <Navigate to="/onboarding" replace />

  return (
    <AppShell onCreateProject={() => setCreateProjectOpen(true)}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage onCreateProject={() => setCreateProjectOpen(true)} />} />
        <Route path="/projects" element={<ProjectsPage onCreateProject={() => setCreateProjectOpen(true)} />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
        <Route path="/projects/:projectId/tasks/:featureId" element={<FeaturePage />} />
        <Route path="/components" element={<ProductPage />} />
        <Route path="/components/:appPartId" element={<AppPartPage />} />
        <Route path="/tasks" element={<MyFeaturesPage />} />
        <Route path="/my-tasks" element={<Navigate to="/tasks" replace />} />
        <Route path="/projects/:projectId/features/:featureId" element={<LegacyTaskRedirect />} />
        <Route path="/product" element={<Navigate to="/components" replace />} />
        <Route path="/product/app-parts/:appPartId" element={<LegacyComponentRedirect />} />
        <Route path="/my-features" element={<Navigate to="/tasks" replace />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <CreateProjectModal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />
    </AppShell>
  )
}

function LegacyTaskRedirect() {
  const { projectId, featureId } = useParams()
  return <Navigate to={`/projects/${projectId}/tasks/${featureId}`} replace />
}

function LegacyComponentRedirect() {
  const { appPartId } = useParams()
  return <Navigate to={`/components/${appPartId}`} replace />
}
