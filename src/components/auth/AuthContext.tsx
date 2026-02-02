
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    loading: boolean
    isAdmin: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isAdmin: false,
    signOut: async () => { },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            setLoading(false)

            if (session?.user) {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('*')
                    .limit(1)

                if (!error && data && data.length > 0) {
                    // We could store settings in context if we wanted, 
                    // but for now we just confirm we can access DB
                }
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setSession(session)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const isAdmin = !!session?.user?.email
    // In a real app we might check specific email against env var here too, 
    // but RLS is the real gatekeeper.

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
