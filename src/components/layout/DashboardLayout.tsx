
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
    const [isAccountOpen, setIsAccountOpen] = useState(false)

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Laden...</div>
    if (!session) return <Navigate to="/login" replace />

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Roosters', path: '/schedules' },
        { icon: Users, label: 'Vrijwilligers', path: '/volunteers' },
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
        setIsAccountOpen(false)
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
                        {/* User Account Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsAccountOpen(!isAccountOpen)}
                                className={`flex items-center gap-3 text-sm transition-all duration-200 py-1.5 px-3 rounded-full border bg-surface hover:bg-surface-hover hover:border-primary/50 group ${isAccountOpen ? 'border-primary ring-1 ring-primary/20' : 'text-secondary'}`}
                            >
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(to right, #8B5CF6, #6366F1)' }}>
                                    {user?.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="truncate hidden sm:block" style={{ maxWidth: '150px' }}>{user?.email}</span>
                                <div className={`transition-transform duration-200 opacity-60 ${isAccountOpen ? 'rotate-180' : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isAccountOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsAccountOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-52 bg-surface border border-[var(--color-border)] rounded-2xl shadow-floating p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleNavigation('/settings')}
                                            className="w-full justify-start gap-3 text-secondary hover:text-white px-3 h-11 border-transparent"
                                        >
                                            <Settings size={18} className="opacity-70" />
                                            Instellingen
                                        </Button>
                                        <div className="h-px bg-white/5 my-1 mx-2" />
                                        <Button
                                            variant="ghost"
                                            onClick={() => signOut()}
                                            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 h-11 border-transparent"
                                        >
                                            <LogOut size={18} />
                                            Uitloggen
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-secondary hover:text-white transition-colors ml-2"
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
                                onClick={() => handleNavigation('/settings')}
                                variant="ghost"
                                className="w-full justify-start gap-3 text-secondary hover:text-white"
                            >
                                <Settings size={20} />
                                Instellingen
                            </Button>

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
            <main className="flex-1 w-full py-8 animate-fade-in relative z-0">
                <div className="w-full max-w-[2000px] mx-auto px-4 md:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
