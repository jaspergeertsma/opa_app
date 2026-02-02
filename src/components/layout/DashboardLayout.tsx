
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function DashboardLayout() {
    const { session, loading, signOut, user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Laden...</div>
    if (!session) return <Navigate to="/login" replace />

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Roosters', path: '/schedules' }, // Note: Adjusted to plural for convention or specific list
        { icon: Users, label: 'Vrijwilligers', path: '/volunteers' },
        { icon: Settings, label: 'Instellingen', path: '/settings' },
    ]

    // Helper to determine exact or sub-route match
    const isActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false
        if (path === '/volunteers' && location.pathname.startsWith('/volunteers')) return true
        if (path === '/schedules' && location.pathname.startsWith('/schedule')) return true
        return location.pathname === path
    }

    return (
        <div className="app-shell">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="app-sidebar-overlay lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="flex flex-col h-full">
                    {/* Logo Box - Clean, no background box */}
                    <div className="h-16 flex items-center px-6 flex-shrink-0 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#6ee7b7] rounded-lg flex items-center justify-center text-[#064e3b] shadow-sm">
                                <LayoutDashboard size={18} />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">OPA Planner</span>
                        </div>
                    </div>

                    {/* Nav - Minimalist List */}
                    <nav className="flex-1 px-4 overflow-y-auto">
                        <ul className="space-y-1 list-none p-0 m-0">
                            {navItems.map((item) => {
                                const active = isActive(item.path)

                                // Clean style: Text color change + subtle background
                                const activeClass = active
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'

                                const iconColor = active ? '#6ee7b7' : 'currentColor'

                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                                ${activeClass}
                                            `}
                                        >
                                            <item.icon size={20} style={{ color: iconColor }} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* User Footer - Clean, no borders */}
                    <div className="p-4 mt-auto flex-shrink-0">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:ring-2 ring-white/20">
                                {user?.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Admin</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="text-slate-500 hover:text-white p-1 transition-colors"
                                title="Uitloggen"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="app-main">
                {/* Mobile Header */}
                <header className="app-mobile-header lg:hidden">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <LayoutDashboard className="text-primary-600" size={20} />
                        <span>OPA Planner</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Scrollable Content Area */}
                <main className="app-content-scroll">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
