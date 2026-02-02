
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Navbar from './Navbar'

export default function Layout() {
    const { session, loading } = useAuth()

    if (loading) return <div className="flex h-screen items-center justify-center">Laden...</div>

    if (!session) return <Navigate to="/login" replace />

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}
