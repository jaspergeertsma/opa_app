
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { KeyRound, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export default function UpdatePassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.updateUser({
            password: password,
        })

        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('Wachtwoord is bijgewerkt! Je wordt doorgestuurd...')
            setTimeout(() => {
                navigate('/')
            }, 2000)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-app)]">
            <Card className="w-full max-w-md" glass>
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                        <KeyRound size={24} className="text-purple-500" />
                    </div>
                    <CardTitle>Wachtwoord instellen</CardTitle>
                    <CardDescription>
                        Kies een nieuw wachtwoord voor je account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <Input
                            type="password"
                            required
                            label="Nieuw Wachtwoord"
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
                            {loading ? 'Bijwerken...' : 'Opslaan'}
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
        </div>
    )
}
