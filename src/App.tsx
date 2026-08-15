import { useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { CreateProjectModal } from "./components/forms/CreateProjectModal"
import { AppShell } from "./components/layout/AppShell"
import { DashboardPage } from "./pages/DashboardPage"
import { FeaturePage } from "./pages/FeaturePage"
import { MyFeaturesPage } from "./pages/MyFeaturesPage"
import { ProjectPage } from "./pages/ProjectPage"
import { ProjectsPage } from "./pages/ProjectsPage"
import { TeamPage } from "./pages/TeamPage"

export default function App() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  return (
    <AppShell onCreateProject={() => setCreateProjectOpen(true)}>
      <Routes>
        <Route path="/" element={<DashboardPage onCreateProject={() => setCreateProjectOpen(true)} />} />
        <Route path="/projects" element={<ProjectsPage onCreateProject={() => setCreateProjectOpen(true)} />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/projects/:projectId/features/:featureId" element={<FeaturePage />} />
        <Route path="/my-features" element={<MyFeaturesPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CreateProjectModal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />
    </AppShell>
  )
}
