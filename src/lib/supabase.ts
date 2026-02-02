
import { createClient } from '@supabase/supabase-js'
import { createMockClient } from './supabase-mock'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const useMock = !supabaseUrl || import.meta.env.VITE_USE_MOCK === 'true'

export const supabase = useMock
    ? createMockClient() as any
    : createClient(supabaseUrl || '', supabaseAnonKey || '')

export type Database = {
    public: {
        Tables: {
            volunteers: {
                Row: {
                    id: string
                    name: string
                    email: string
                    notes: string | null
                    allow_double: boolean
                    active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    notes?: string | null
                    allow_double?: boolean
                    active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    notes?: string | null
                    allow_double?: boolean
                    active?: boolean
                    created_at?: string
                }
            }
            schedules: {
                Row: {
                    id: string
                    name: string
                    year: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    year: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    year?: number
                    is_active?: boolean
                    created_at?: string
                }
            }
            schedule_dates: {
                Row: {
                    id: string
                    schedule_id: string
                    date: string
                    reminder_sent_at: string | null
                }
                Insert: {
                    id?: string
                    schedule_id: string
                    date: string
                    reminder_sent_at?: string | null
                }
                Update: {
                    id?: string
                    schedule_id?: string
                    date?: string
                    reminder_sent_at?: string | null
                }
            }
            assignments: {
                Row: {
                    id: string
                    schedule_date_id: string
                    role: 'V1' | 'V2' | 'L1' | 'L2' | 'R1' | 'R2'
                    volunteer_id: string | null
                }
                Insert: {
                    id?: string
                    schedule_date_id: string
                    role: 'V1' | 'V2' | 'L1' | 'L2' | 'R1' | 'R2'
                    volunteer_id?: string | null
                }
                Update: {
                    id?: string
                    schedule_date_id?: string
                    role?: 'V1' | 'V2' | 'L1' | 'L2' | 'R1' | 'R2'
                    volunteer_id?: string | null
                }
            }
        }
    }
}
