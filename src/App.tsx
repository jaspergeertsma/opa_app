
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './components/auth/Login'
import Dashboard from './components/dashboard/Dashboard'
import VolunteerList from './components/volunteers/VolunteerList'
import ScheduleEditor from './components/schedule/ScheduleEditor'
import NewScheduleWizard from './components/schedule/NewScheduleWizard'
import SettingsPage from './components/settings/SettingsPage'
import VolunteerDetail from './components/volunteers/VolunteerDetail'
import UpdatePassword from './components/auth/UpdatePassword'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter basename="/opa_app">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/update-password" element={<UpdatePassword />} />

                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/volunteers" element={<VolunteerList />} />
                        <Route path="/volunteers/:id" element={<VolunteerDetail />} />
                        <Route path="/schedules" element={<Dashboard />} />
                        <Route path="/schedule/new" element={<NewScheduleWizard />} />
                        <Route path="/schedule/:id" element={<ScheduleEditor />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
