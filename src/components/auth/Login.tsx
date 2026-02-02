
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LayoutTemplate } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function Login() {
    const navigate = useNavigate()
    const { session } = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (session) {
            navigate('/')
        }
    }, [session, navigate])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')


        // In strict mode, we might want to check if email is the admin email locally too, 
        // but the backend sends the magic link anyway.

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })

        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('Check je email voor de login link!')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-app">
            <div className="card w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-primary-100 rounded-full mb-4">
                        <LayoutTemplate size={32} className="text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Oud Papier Planner</h1>
                    <p className="text-center text-slate-500">Beheerders toegang</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email adres</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@school.nl"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Versturen...' : 'Stuur Magic Link'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-md text-sm text-center ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
