
import { LayoutDashboard, Calendar, Users, Settings, LogOut } from 'lucide-react'

import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'


export default function DashboardLayout() {
    const { session, loading, signOut, user } = useAuth()
    const location = useLocation()

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Laden...</div>
    if (!session) return <Navigate to="/login" replace />

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Roosters', path: '/schedules' },
        { icon: Users, label: 'Vrijwilligers', path: '/volunteers' },
        { icon: Settings, label: 'Instellingen', path: '/settings' },
    ]

    const isActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false
        if (path === '/volunteers' && location.pathname.startsWith('/volunteers')) return true
        if (path === '/schedules' && location.pathname.startsWith('/schedule')) return true
        return location.pathname === path
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)] flex flex-col">
            {/* Topbar */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg-app)]/80 backdrop-blur-md">
                <div className="container h-16 flex items-center justify-between py-3">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <LayoutDashboard size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
                            OPA Junior <span className="text-[var(--color-primary-end)]">Studio</span>
                        </span>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-primary-end)]">
                                {user?.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[150px]">{user?.email}</span>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="btn btn-secondary text-xs py-2 px-4 h-9 rounded-full hover:bg-white/5 border-[var(--color-border)] hover:border-[var(--color-primary-end)] transition-all"
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs (Horizontal) */}
                <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-app)]">
                    <div className="container">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar">
                            {navItems.map((item) => {
                                const active = isActive(item.path)
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                                            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap gap-2
                                            ${active
                                                ? 'border-[var(--color-primary-end)] text-[var(--color-primary-end)]'
                                                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]'
                                            }
                                        `}
                                    >
                                        <item.icon size={18} className={`transition-colors ${active ? 'text-[var(--color-primary-end)]' : 'group-hover:text-white'}`} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container py-8 animate-fade-in relative z-0">
                <div className="max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Sticky Mobile Nav (Optional / Alternative to top tabs for better mobile UX? 
                Request says "Mobile: Topbar compact, tabs scrollable". 
                The top overflow-x-auto nav handles this well.) 
            */}
        </div>
    )
}
