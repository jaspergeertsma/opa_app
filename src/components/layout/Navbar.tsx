
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Calendar, Users, LogOut, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
    const { signOut, user } = useAuth()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
                    <LayoutDashboard className="text-primary-600" />
                    <span>Oud Papier</span>
                </Link>

                <div className="flex items-center gap-1 md:gap-4">
                    <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/')}`}>
                        <Calendar size={18} />
                        <span className="hidden md:inline">Roosters</span>
                    </Link>
                    <Link to="/volunteers" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/volunteers')}`}>
                        <Users size={18} />
                        <span className="hidden md:inline">Vrijwilligers</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 hidden md:inline">{user?.email}</span>
                    <button onClick={() => signOut()} className="btn btn-ghost btn-sm text-slate-500">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    )
}
