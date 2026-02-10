
import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Schedule, Volunteer, Role, Assignment, ScheduleDate } from '../../types'
import { Download, ArrowLeft, CheckCircle, AlertTriangle, Save, Calendar, BarChart3 } from 'lucide-react'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import clsx from 'clsx'

export default function ScheduleEditor() {
    const { id } = useParams()
    const [schedule, setSchedule] = useState<Schedule | null>(null)
    const [dates, setDates] = useState<ScheduleDate[]>([])
    const [volunteers, setVolunteers] = useState<Volunteer[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (id) loadData(id)
    }, [id])

    const loadData = async (scheduleId: string) => {
        setLoading(true)

        // 1. Fetch Schedule
        const { data: sData } = await supabase.from('schedules').select('*').eq('id', scheduleId).single()
        if (sData) setSchedule(sData)

        // 2. Fetch Dates & Assignments
        const { data: dData } = await supabase
            .from('schedule_dates')
            .select(`
          *,
          assignments (*)
        `)
            .eq('schedule_id', scheduleId)
            .order('date')

        if (dData) setDates(dData)

        // 3. Fetch Volunteers
        const { data: vData } = await supabase.from('volunteers').select('*').order('name')
        if (vData) setVolunteers(vData)

        setLoading(false)
    }

    const handleAssignmentChange = async (assignmentId: string, volunteerId: string) => {
        // Optimistic Update
        const newDates = dates.map((d: ScheduleDate) => ({
            ...d,
            assignments: d.assignments.map((a: Assignment) =>
                a.id === assignmentId ? { ...a, volunteer_id: volunteerId } : a
            )
        }))
        setDates(newDates)
        setSaving(true)

        // DB Update
        const { error } = await supabase
            .from('assignments')
            .update({ volunteer_id: volunteerId === 'null' ? null : volunteerId })
            .eq('id', assignmentId)

        setSaving(false)
        if (error) {
            console.error(error)
            alert("Error saving change")
            loadData(id!) // Revert
        }
    }

    const handleActivate = async () => {
        if (!schedule) return
        const { error } = await supabase.from('schedules').update({ is_active: !schedule.is_active }).eq('id', schedule.id)
        if (!error) setSchedule({ ...schedule, is_active: !schedule.is_active })
    }

    const exportCSV = () => {
        if (!dates.length) return
        const rows = dates.map((d: ScheduleDate) => {
            const row: any = { Date: d.date }
            d.assignments.forEach((a: Assignment) => {
                const vol = volunteers.find(v => v.id === a.volunteer_id)
                row[a.role] = vol ? vol.name : ''
            })
            return row
        })
        const csv = Papa.unparse(rows)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${schedule?.name}_rooster.csv`
        link.click()
    }

    // Statistics Calculation
    const stats = useMemo(() => {
        const s: Record<string, { total: number, weight: number, roles: Record<Role, number> }> = {}
        volunteers.forEach(v => {
            s[v.id] = { total: 0, weight: 0, roles: { V1: 0, V2: 0, L1: 0, L2: 0, R1: 0, R2: 0 } }
        })

        dates.forEach((d: ScheduleDate) => {
            d.assignments.forEach((a: Assignment) => {
                if (a.volunteer_id && s[a.volunteer_id]) {
                    s[a.volunteer_id].total++
                    s[a.volunteer_id].roles[a.role as Role]++
                    s[a.volunteer_id].weight += (a.role.startsWith('R') ? 0.35 : 1.0)
                }
            })
        })
        return s
    }, [dates, volunteers])

    // Validation
    const getValidation = (date: ScheduleDate) => {
        const warnings: string[] = []
        const volunteerCounts: Record<string, number> = {}

        // Check completeness
        const assignedCount = date.assignments.filter(a => a.volunteer_id).length
        if (assignedCount < 6) warnings.push('Niet compleet')

        // Check double
        date.assignments.forEach(a => {
            if (a.volunteer_id) {
                volunteerCounts[a.volunteer_id] = (volunteerCounts[a.volunteer_id] || 0) + 1
            }
        })

        Object.entries(volunteerCounts).forEach(([vid, count]) => {
            if (count > 1) {
                const v = volunteers.find(vol => vol.id === vid)
                if (v && !v.allow_double) {
                    warnings.push(`${v.name} dubbel`)
                }
            }
        })

        return warnings
    }

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-end)]"></div>
        </div>
    )
    if (!schedule) return <div>Niet gevonden</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {schedule.name}
                            {schedule.is_active && <Badge variant="success">Actief</Badge>}
                        </h1>
                        <p className="text-[var(--color-text-secondary)] text-sm flex items-center gap-2">
                            {saving ? <span className="flex items-center gap-1 text-yellow-500"><Save size={12} /> Opslaan...</span> : <span className="flex items-center gap-1 text-green-500"><CheckCircle size={12} /> Opgeslagen</span>}
                            <span className="text-[var(--color-text-muted)]">•</span>
                            {dates.length} inzameldagen
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={exportCSV} icon={<Download size={16} />}>
                        CSV
                    </Button>
                    <Button
                        variant={schedule.is_active ? "ghost" : "primary"}
                        onClick={handleActivate}
                        className={schedule.is_active ? "text-green-500 hover:text-green-400 hover:bg-green-500/10" : ""}
                    >
                        {schedule.is_active ? 'Deactiveren' : 'Activeren'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* LEFT: Editor */}
                <div className="flex-1 w-full space-y-4">
                    {dates.map((date) => {
                        const warnings = getValidation(date)
                        const hasWarnings = warnings.length > 0

                        return (
                            <Card key={date.id} className={clsx(
                                "border-l-4 transition-all duration-300",
                                hasWarnings ? "border-l-yellow-500 shadow-yellow-500/5" : "border-l-green-500"
                            )}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
                                        <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--color-text-primary)]">
                                            <Calendar size={18} className="text-[var(--color-text-muted)]" />
                                            {new Date(date.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h3>

                                        <div className="flex items-center gap-3">
                                            {date.reminder_sent_at && (
                                                <Badge variant="success" className="gap-1 px-2 py-0.5"><CheckCircle size={12} /> Herinnering</Badge>
                                            )}
                                            {hasWarnings && (
                                                <div className="flex flex-col items-end gap-1">
                                                    {warnings.map((w, i) => (
                                                        <Badge key={i} variant="warning" className="gap-1 px-2 py-0.5">
                                                            <AlertTriangle size={12} /> {w}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {['V1', 'V2', 'L1', 'L2', 'R1', 'R2'].map((role) => {
                                            const assignment = date.assignments.find(a => a.role === role)
                                            return (
                                                <div key={role} className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pl-1">{role}</span>
                                                    {assignment && (
                                                        <div className="relative">
                                                            <select
                                                                className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] text-sm p-2.5 rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary-end)] focus:ring-1 focus:ring-[var(--color-primary-end)] outline-none appearance-none transition-colors cursor-pointer hover:border-[var(--color-border-hover)]"
                                                                value={assignment.volunteer_id || 'null'}
                                                                onChange={(e) => handleAssignmentChange(assignment.id, e.target.value)}
                                                            >
                                                                <option value="null" className="text-slate-500">- Kies -</option>
                                                                {volunteers.map(v => (
                                                                    <option key={v.id} value={v.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                                                                        {v.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {/* Custom arrow could go here */}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* RIGHT: Fairness Dashboard */}
                <div className="w-full lg:w-80 shrink-0 sticky top-24">
                    <Card className="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar border-[var(--color-border)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 size={18} className="text-purple-400" /> Statistieken
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Metrics Summary */}
                            <div className="bg-[var(--color-bg-app)] p-3 rounded-lg text-xs text-[var(--color-text-secondary)] space-y-2 border border-[var(--color-border)]">
                                <div className="flex justify-between items-center">
                                    <span>Max-Min Load:</span>
                                    <span className="font-mono font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-surface)] px-1.5 py-0.5 rounded">
                                        {(Math.max(...Object.values(stats).map(s => s.weight)) - Math.min(...Object.values(stats).map(s => s.weight))).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Max-Min Werk:</span>
                                    <span className="font-mono font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-surface)] px-1.5 py-0.5 rounded">
                                        {Math.max(...Object.values(stats).map(s => s.total - (s.roles.R1 + s.roles.R2))) - Math.min(...Object.values(stats).map(s => s.total - (s.roles.R1 + s.roles.R2)))}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {volunteers
                                    .filter(v => stats[v.id]?.total > 0)
                                    .sort((a, b) => (stats[b.id]?.weight || 0) - (stats[a.id]?.weight || 0))
                                    .map(v => {
                                        const s = stats[v.id]
                                        return (
                                            <div key={v.id} className="text-sm border-b border-[var(--color-border)] hover:bg-[var(--color-bg-app)] p-2 rounded transition-colors group">
                                                <div className="flex justify-between font-medium text-[var(--color-text-primary)]">
                                                    <span>{v.name}</span>
                                                    <span className={clsx("font-mono text-xs", s.weight > 5 ? "text-purple-400" : "text-[var(--color-text-secondary)]")}>{s.weight.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                                    <span>Tot: {s.total}</span>
                                                    <span>Res: {s.roles.R1 + s.roles.R2}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
