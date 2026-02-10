
import { useState } from 'react'
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X } from 'lucide-react'
import { useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../ui/Button'

export default function DashboardLayout() {
    const { session, loading, signOut, user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

    const handleNavigation = (path: string) => {
        navigate(path)
        setIsMobileMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-app flex flex-col">
            {/* Main Header */}
            <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md shadow-sm" style={{ backgroundColor: 'rgba(11, 18, 32, 0.95)', borderColor: 'var(--color-border)' }}>
                <div className="container px-4 h-20 flex items-center justify-between">

                    {/* Left Side: Brand & Navigation */}
                    <div className="flex items-center gap-8">
                        {/* Brand */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}>
                                <LayoutDashboard size={20} className="text-white" />
                            </div>
                            <span className="font-bold text-xl text-white hidden sm:block">
                                OPA <span className="text-primary">Studio</span>
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navItems.map((item) => {
                                const active = isActive(item.path)
                                return (
                                    <Button
                                        key={item.path}
                                        onClick={() => handleNavigation(item.path)}
                                        variant={active ? 'secondary' : 'ghost'}
                                        // Use standard button classes but override colors based on active state
                                        className={`gap-2 transition-all duration-200 border ${active ? 'bg-surface-hover text-white shadow-sm' : 'text-secondary hover:text-white border-transparent'}`}
                                        style={active ? { borderColor: 'var(--color-border-hover)' } : {}}
                                    >
                                        <item.icon size={18} className={active ? 'text-primary' : ''} />
                                        {item.label}
                                    </Button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Right Side: User & Actions */}
                    <div className="flex items-center gap-4">
                        {/* User Info - Desktop */}
                        <div className="hidden lg:flex items-center gap-3 text-sm text-secondary bg-surface py-1.5 px-3 rounded-full border">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(to right, #8B5CF6, #6366F1)' }}>
                                {user?.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate" style={{ maxWidth: '150px' }}>{user?.email}</span>
                        </div>

                        {/* Logout Button */}
                        <div className="hidden md:block">
                            <Button
                                onClick={() => signOut()}
                                variant="ghost"
                                className="text-secondary hover:text-red-400"
                                icon={<LogOut size={18} />}
                            >
                                <span className="hidden lg:inline">Uitloggen</span>
                            </Button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-secondary hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t bg-surface animate-in slide-in-from-top-2">
                        <div className="p-4 space-y-4">
                            <div className="flex flex-col space-y-2">
                                {navItems.map((item) => {
                                    const active = isActive(item.path)
                                    return (
                                        <Button
                                            key={item.path}
                                            onClick={() => handleNavigation(item.path)}
                                            variant={active ? 'secondary' : 'ghost'}
                                            className={`w-full justify-start gap-3 h-12 text-base border ${active ? 'bg-surface-hover text-white' : 'text-secondary hover:text-white border-transparent'}`}
                                            style={active ? { borderColor: 'var(--color-border-hover)' } : {}}
                                        >
                                            <item.icon size={20} className={active ? 'text-primary' : ''} />
                                            {item.label}
                                        </Button>
                                    )
                                })}
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ background: 'linear-gradient(to right, #8B5CF6, #6366F1)' }}>
                                    {user?.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm text-secondary truncate">{user?.email}</span>
                            </div>

                            <Button
                                onClick={() => signOut()}
                                variant="ghost"
                                className="w-full justify-start gap-3 text-red-400 hover:text-red-300"
                            >
                                <LogOut size={20} />
                                Uitloggen
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 container py-8 animate-fade-in relative z-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-0">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
