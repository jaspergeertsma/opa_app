
export type Role = 'V1' | 'V2' | 'L1' | 'L2' | 'R1' | 'R2'

export interface Volunteer {
    id: string
    name: string
    email: string
    notes: string | null
    allow_double: boolean
    active: boolean
    created_at?: string
    // Computed for dashboard
    stats?: {
        [key in Role]?: number
    } & {
        total: number
        workload: number
    }
}

export interface Schedule {
    id: string
    name: string
    year: number
    is_active: boolean
    created_at: string
}

export interface ScheduleDate {
    id: string
    schedule_id: string
    date: string
    reminder_sent_at: string | null
    assignments: Assignment[]
}

export interface Assignment {
    id: string
    schedule_date_id: string
    role: Role
    volunteer_id: string | null
    volunteer?: Volunteer // joined
}

export interface NotificationLog {
    id: string
    volunteer_id: string
    schedule_date_id?: string
    sent_at: string
    to_email: string
    subject: string
    body_text: string
    status: 'sent' | 'failed' | 'skipped'
    provider_message_id?: string
    error?: string
}

export interface AppSettings {
    admin_email: string
    admin_name: string
    cc_email_1: string
    cc_email_2: string
    subject_template: string
    text_template: string
    timezone: string
}
