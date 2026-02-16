import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Mail, ArrowRight } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export default function Login() {
    const navigate = useNavigate()
    const { session } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setMessage('Error: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-[var(--color-bg-app)]">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[100px]"></div>
            </div>

            <Card className="w-full max-w-md border-[var(--color-border)] shadow-floating" glass>
                <CardHeader className="text-center pt-8 pb-2">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-900/30">
                        <LayoutDashboard size={24} className="text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Welkom terug</CardTitle>
                    <CardDescription>
                        Log in op OPA Planner
                    </CardDescription>
                    {(import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_SUPABASE_URL) && (
                        <div className="mt-2 text-xs font-mono bg-amber-500/10 text-amber-500 p-2 rounded border border-amber-500/20">
                            ⚠️ MOCK MODE ACTIVATED
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-8">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <Input
                            type="email"
                            required
                            label="Email adres"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="naam@school.nl"
                            icon={<Mail size={16} />}
                        />

                        <Input
                            type="password"
                            required
                            label="Wachtwoord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            variant="primary"
                            className="w-full mt-2"
                            icon={!loading && <ArrowRight size={16} />}
                        >
                            {loading ? 'Inloggen...' : 'Inloggen'}
                        </Button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-sm text-center border ${message.includes('Error')
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                            {message}
                        </div>
                    )}
                </CardContent>
            </Card>

            <p className="mt-8 text-xs text-[var(--color-text-muted)] opacity-50">
                &copy; {new Date().getFullYear()} OPA Planner
            </p>
        </div>
    )
}
