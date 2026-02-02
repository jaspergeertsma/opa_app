
import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Schedule, Volunteer, Role, Assignment, ScheduleDate } from '../../types'
import { Download, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import Papa from 'papaparse'

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
        if (assignedCount < 6) warnings.push('Niet compleet (minder dan 6)')

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
                    warnings.push(`${v.name} staat ${count}x ingepland maar mag niet dubbel.`)
                }
                // Check adjacency could be done here (e.g. V1 & V2 is adjacent, V1 & R1 is not)
                // Hardcoded simplifiction for now
            }
        })

        return warnings
    }

    if (loading) return <div>Laden...</div>
    if (!schedule) return <div>Niet gevonden</div>

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* LEFT: Editor */}
            <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="btn btn-ghost btn-sm px-2"><ArrowLeft size={20} /></Link>
                        <div>
                            <h1 className="text-2xl font-bold">{schedule.name}</h1>
                            <div className="text-sm text-slate-500">
                                {saving ? 'Opslaan...' : 'Wijzigingen worden direct opgeslagen'}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportCSV} className="btn btn-secondary btn-sm">
                            <Download size={16} /> Export CSV
                        </button>
                        <button
                            onClick={handleActivate}
                            className={`btn btn-sm ${schedule.is_active ? 'btn-success bg-green-100 text-green-800' : 'btn-secondary'}`}
                        >
                            {schedule.is_active ? 'Actief' : 'Maak Actief'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {dates.map((date) => {
                        const warnings = getValidation(date)
                        return (
                            <div key={date.id} className={`card ${warnings.length ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-400'}`}>
                                <div className="flex flex-col md:flex-row justify-between mb-4 border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {new Date(date.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        {date.reminder_sent_at && <span title="Herinnering verstuurd" className="text-green-500"><CheckCircle size={16} /></span>}
                                    </h3>
                                    {warnings.length > 0 && (
                                        <div className="text-xs text-yellow-600 flex flex-col items-end">
                                            {warnings.map((w, i) => <span key={i} className="flex items-center gap-1"><AlertTriangle size={12} /> {w}</span>)}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {['V1', 'V2', 'L1', 'L2', 'R1', 'R2'].map((role) => {
                                        const assignment = date.assignments.find(a => a.role === role)
                                        return (
                                            <div key={role} className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase">{role}</span>
                                                {assignment && (
                                                    <select
                                                        className="text-sm p-2 rounded border border-slate-200"
                                                        value={assignment.volunteer_id || 'null'}
                                                        onChange={(e) => handleAssignmentChange(assignment.id, e.target.value)}
                                                    >
                                                        <option value="null">- Kies -</option>
                                                        {volunteers.map(v => (
                                                            <option key={v.id} value={v.id}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT: Fairness Dashboard */}
            <div className="w-full lg:w-80 shrink-0 sticky top-24">
                <div className="card bg-white p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    <h3 className="font-bold mb-4">Statistieken</h3>

                    {/* Metrics Summary */}
                    <div className="mb-4 bg-slate-50 p-2 rounded text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                            <span>Max-Min Load:</span>
                            <span className="font-mono font-bold">
                                {(Math.max(...Object.values(stats).map(s => s.weight)) - Math.min(...Object.values(stats).map(s => s.weight))).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Max-Min Werk:</span>
                            <span className="font-mono font-bold">
                                {Math.max(...Object.values(stats).map(s => s.total - (s.roles.R1 + s.roles.R2))) - Math.min(...Object.values(stats).map(s => s.total - (s.roles.R1 + s.roles.R2)))}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {volunteers
                            .filter(v => stats[v.id]?.total > 0)
                            .sort((a, b) => (stats[b.id]?.weight || 0) - (stats[a.id]?.weight || 0))
                            .map(v => {
                                const s = stats[v.id]
                                return (
                                    <div key={v.id} className="text-sm border-b border-slate-50 pb-2">
                                        <div className="flex justify-between font-medium">
                                            <span>{v.name}</span>
                                            <span>{s.weight.toFixed(2)} pts</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                                            <span>Totaal: {s.total}x</span>
                                            <span>R: {s.roles.R1 + s.roles.R2}x</span>
                                        </div>
                                        {/* Detailed Breakdown for verification */}
                                        <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-300 mt-1">
                                            <span title="V1">V1:{s.roles.V1}</span>
                                            <span title="V2">V2:{s.roles.V2}</span>
                                            <span title="L1">L1:{s.roles.L1}</span>
                                            <span title="L2">L2:{s.roles.L2}</span>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
