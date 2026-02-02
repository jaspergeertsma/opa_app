
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// --- Mock Data Store ---
const STORE = {
    volunteers: [
        { id: 'v1', name: 'Jan Jansen', email: 'jan@example.com', active: true, allow_double: true, notes: 'Graag in ochtend' },
        { id: 'v2', name: 'Piet Pietersen', email: 'piet@example.com', active: true, allow_double: false, notes: null },
        { id: 'v3', name: 'Klaas Klaassen', email: 'klaas@example.com', active: true, allow_double: false, notes: null },
        { id: 'v4', name: 'Els de Boer', email: 'els@example.com', active: true, allow_double: true, notes: null },
        { id: 'v5', name: 'Wim Willem', email: 'wim@example.com', active: true, allow_double: false, notes: null },
        { id: 'v6', name: 'Linda Loper', email: 'linda@example.com', active: true, allow_double: true, notes: null },
        { id: 'v7', name: 'Gerda Groen', email: 'gerda@example.com', active: true, allow_double: false, notes: null },
        { id: 'v8', name: 'Henk Hamer', email: 'henk@example.com', active: true, allow_double: false, notes: null },
        { id: 'v9', name: 'Truus Tulp', email: 'truus@example.com', active: true, allow_double: false, notes: null },
        { id: 'v10', name: 'Hans Haas', email: 'hans@example.com', active: true, allow_double: true, notes: null },
        { id: 'v11', name: 'Greet Geel', email: 'greet@example.com', active: true, allow_double: false, notes: null },
        { id: 'v12', name: 'Bas Blauw', email: 'bas@example.com', active: true, allow_double: false, notes: null },
        { id: 'v13', name: 'Karel Klus', email: 'karel@example.com', active: true, allow_double: false, notes: null },
        { id: 'v14', name: 'Mina Muis', email: 'mina@example.com', active: true, allow_double: false, notes: null },
        { id: 'v15', name: 'Dirk Draad', email: 'dirk@example.com', active: true, allow_double: true, notes: null },
        { id: 'v16', name: 'Sofie Staal', email: 'sofie@example.com', active: true, allow_double: false, notes: null }
    ],
    schedules: [
        { id: 's1', name: 'Rooster 2025', year: 2025, is_active: true, created_at: new Date().toISOString() }
    ],
    schedule_dates: [] as any[],
    assignments: [] as any[],
    notification_logs: [] as any[],
    app_settings: [
        { key: 'admin_email', value: 'admin@school.nl' },
        { key: 'admin_name', value: 'Oud Papier Team' },
        { key: 'subject_template', value: 'Oud papier – planning voor zaterdag {DATE}' },
        { key: 'text_template', value: 'Hallo {SALUTATION},\n\nJouw rol: {ROLE}\nTijd: {TIME_START} - {TIME_END}\n\nTot zaterdag!' },
        { key: 'timezone', value: 'Europe/Amsterdam' }
    ]
}

// Populate some initial schedule data for s1
const roles = ['V1', 'V2', 'L1', 'L2', 'R1', 'R2']
for (let i = 0; i < 12; i++) {
    const dateId = `d${i}`
    const dateStr = new Date(2025, 0, (i * 14) + 4).toISOString().split('T')[0] // Every 2 weeks approx

    STORE.schedule_dates.push({
        id: dateId,
        schedule_id: 's1',
        date: dateStr,
        reminder_sent_at: i === 0 ? new Date().toISOString() : null
    })

    // Random assignments
    roles.forEach((role, idx) => {
        STORE.assignments.push({
            id: `a${i}_${role}`,
            schedule_date_id: dateId,
            role: role,
            volunteer_id: STORE.volunteers[idx % 6].id // Simple round robin
        })
    })
}


// --- Mock Client ---

class MockQueryBuilder {
    table: string
    // ... (keep class generic properties)
    data: any[]
    filters: ((row: any) => boolean)[] = []
    modifiers: ((data: any[]) => any[])[] = []
    queuedOperation: (() => any) | null = null

    constructor(table: string) {
        this.table = table
        this.data = [...(STORE[table as keyof typeof STORE] || [])]
    }

    select(columns = '*') {
        if (this.table === 'schedule_dates' && columns.includes('assignments')) {
            this.modifiers.push((rows) => {
                return rows.map(row => ({
                    ...row,
                    assignments: STORE.assignments.filter(a => a.schedule_date_id === row.id)
                }))
            })
        }
        return this
    }

    order(col: string, { ascending = true } = {}) {
        this.modifiers.push((rows) => {
            return rows.sort((a, b) => {
                if (a[col] < b[col]) return ascending ? -1 : 1
                if (a[col] > b[col]) return ascending ? 1 : -1
                return 0
            })
        })
        return this
    }

    eq(col: string, val: any) {
        this.filters.push(row => row[col] === val)
        return this
    }

    single() {
        this.modifiers.push(rows => rows[0] || null)
        return this
    }

    insert(record: any | any[]) {
        this.queuedOperation = () => {
            const records = Array.isArray(record) ? record : [record]
            const newRows = records.map(r => ({ ...r, id: r.id || uuidv4() }))
            const storeTable = STORE[this.table as keyof typeof STORE] as any[]
            storeTable.push(...newRows)
            return newRows
        }
        return this
    }

    update(updates: any) {
        this.queuedOperation = () => {
            const storeTable = STORE[this.table as keyof typeof STORE] as any[]
            const rowsToUpdate = storeTable.filter(row => this.filters.every(f => f(row)))
            rowsToUpdate.forEach(row => Object.assign(row, updates))
            return rowsToUpdate
        }
        return this
    }

    delete() {
        this.queuedOperation = () => {
            const storeTable = STORE[this.table as keyof typeof STORE] as any[]
            const indexesToRemove: number[] = []
            storeTable.forEach((row, i) => {
                if (this.filters.every(f => f(row))) indexesToRemove.push(i)
            })
            indexesToRemove.reverse().forEach(i => storeTable.splice(i, 1))
            return null
        }
        return this
    }

    then(resolve: (res: { data: any, error: any }) => void) {
        setTimeout(() => {
            try {
                let result: any
                if (this.queuedOperation) {
                    result = this.queuedOperation()
                    if (Array.isArray(result) && this.modifiers.some(m => m.toString().includes('0'))) {
                        result = result[0]
                    }
                } else {
                    let rows = this.data.filter(row => this.filters.every(f => f(row)))
                    for (const mod of this.modifiers) {
                        rows = mod(rows)
                    }
                    result = rows
                }
                resolve({ data: result, error: null })
            } catch (e: any) {
                resolve({ data: null, error: { message: e.message } })
            }
        }, 50)
    }
}

export function createMockClient() {
    console.log('%c MOCK SUPABASE CLIENT ACTIVATED ', 'background: #222; color: #bada55; font-size: 14px')

    // Define mock types locally as external import is removed
    type User = {
        id: string;
        email: string;
        aud: string;
        app_metadata: { provider: string };
        user_metadata: {};
        created_at: string;
        phone: string;
        role: string;
        updated_at: string;
    }

    type Session = {
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
        user: User;
    }

    const user: User = {
        id: 'mock-admin-id',
        email: 'admin@school.nl',
        aud: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: new Date().toISOString(),
        phone: '',
        role: 'authenticated',
        updated_at: new Date().toISOString()
    }

    const session: Session = {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user
    }

    // Auth State
    let signedIn = false
    const subscribers = new Set<(event: string, session: Session | null) => void>()

    return {
        from: (table: string) => new MockQueryBuilder(table),
        auth: {
            getSession: async () => {
                return { data: { session: signedIn ? session : null }, error: null }
            },
            signInWithOtp: async ({ email }: any) => {
                console.log(`Mock Login for: ${email}`)
                signedIn = true
                // NOTIFY SUBSCRIBERS to trigger auto-login in UI
                subscribers.forEach(cb => cb('SIGNED_IN', session))
                return { error: null }
            },
            signOut: async () => {
                signedIn = false
                subscribers.forEach(cb => cb('SIGNED_OUT', null))
                return { error: null }
            },
            onAuthStateChange: (callback: any) => {
                subscribers.add(callback)
                // Fire immediately with current state
                callback(signedIn ? 'SIGNED_IN' : 'SIGNED_OUT', signedIn ? session : null)
                return { data: { subscription: { unsubscribe: () => subscribers.delete(callback) } } }
            }
        }
    }
}
