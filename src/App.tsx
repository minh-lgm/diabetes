import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import GlucosePage from './pages/GlucosePage'
import HbA1cPage from './pages/HbA1cPage'
import BodyPage from './pages/BodyPage'
import BloodPressurePage from './pages/BloodPressurePage'
import LabsPage from './pages/LabsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="glucose" element={<GlucosePage />} />
          <Route path="hba1c" element={<HbA1cPage />} />
          <Route path="body" element={<BodyPage />} />
          <Route path="blood-pressure" element={<BloodPressurePage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
