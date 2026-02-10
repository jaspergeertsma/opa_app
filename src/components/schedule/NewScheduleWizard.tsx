
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer } from '../../types'
import { generateSchedule } from '../../lib/scheduler'
import { ArrowRight, ArrowLeft, Calendar as CalendarIcon, Users, Wand2, Check } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import clsx from 'clsx'

export default function NewScheduleWizard() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data State
    const [name, setName] = useState('')
    const [year, setYear] = useState(new Date().getFullYear())
    const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([])
    const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set())
    const [dates, setDates] = useState<string[]>(Array(12).fill(''))

    useEffect(() => {
        // Load volunteers on mount
        supabase.from('volunteers').select('*').eq('active', true).then(({ data }: { data: any }) => {
            if (data) {
                setAllVolunteers(data as Volunteer[])
                setSelectedVolunteers(new Set((data as Volunteer[]).map(v => v.id)))
            }
        })

        // Predetermine name & dates
        const nextYear = new Date().getFullYear() + 1
        setName(`Rooster ${nextYear}`)
        setYear(nextYear)

        // Generate Default Dates (First Saturday of each month)
        const defaultDates: string[] = []
        for (let month = 0; month < 12; month++) {
            const d = new Date(nextYear, month, 1)
            // Determine day of week (0=Sun, 6=Sat)
            // If d.getDay() is 6 (Sat), offset is 0
            // If d.getDay() is 0 (Sun), offset is 6
            // If d.getDay() is 1 (Mon), offset is 5
            // Formula: (6 - day + 7) % 7
            const day = d.getDay()
            const offset = (6 - day + 7) % 7
            d.setDate(d.getDate() + offset) // Move to first Saturday

            // Format YYYY-MM-DD manually to avoid timezone issues with toISOString
            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            defaultDates.push(`${yyyy}-${mm}-${dd}`)
        }
        setDates(defaultDates)
    }, [])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const toggleVolunteer = (id: string) => {
        const newSet = new Set(selectedVolunteers)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedVolunteers(newSet)
    }

    const handleDateChange = (index: number, val: string) => {
        const newDates = [...dates]
        newDates[index] = val
        setDates(newDates)
    }

    // Generation Logic
    const generateAndSave = async () => {
        setLoading(true)

        try {
            // 1. Create Schedule
            const { data: scheduleData, error: sError } = await supabase
                .from('schedules')
                .insert({ name, year, is_active: false })
                .select()
                .single()

            if (sError || !scheduleData) throw sError

            const scheduleId = scheduleData.id

            // 2. Prepare Generation
            // Roles set for each date: V1, V2, L1, L2, R1, R2
            const pool = allVolunteers.filter(v => selectedVolunteers.has(v.id))

            // 3. Generate using Engine (2-Phase)
            const validDates = dates.filter(d => d)
            const result = generateSchedule(validDates, pool)

            // 4. Insert Dates
            // Map temp_id to real database IDs
            const tempIdMap = new Map<string, string>() // temp_id -> db_id

            const { data: dateRows, error: dError } = await supabase
                .from('schedule_dates')
                .insert(result.schedule_dates.map(d => ({ schedule_id: scheduleId, date: d.date })))
                .select()

            if (dError || !dateRows) throw dError

            // Reconstruct map assuming order is preserved (it usually is in simple inserts, but let's be safe if we had temp IDs)
            // Since we inserted result.schedule_dates in order, dateRows[i] corresponds to result.schedule_dates[i]
            result.schedule_dates.forEach((d, i) => {
                tempIdMap.set(d.temp_id, dateRows[i].id)
            })

            // 5. Insert Assignments
            const assignmentsToInsert = result.assignments.map(a => ({
                schedule_date_id: tempIdMap.get(a.date_temp_id),
                role: a.role,
                volunteer_id: a.volunteer_id
            }))

            if (assignmentsToInsert.length > 0) {
                const { error: aError } = await supabase
                    .from('assignments')
                    .insert(assignmentsToInsert)

                if (aError) throw aError
            }

            // Success
            navigate(`/schedule/${scheduleId}`)

        } catch (err: any) {
            console.error(err)
            alert('Error generating schedule: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-6">Nieuw Rooster</h1>
                <div className="flex justify-center items-center gap-4">
                    {[1, 2, 3, 4].map(s => {
                        const isActive = step >= s;
                        const isCurrent = step === s;
                        return (
                            <div key={s} className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                                    isActive
                                        ? "bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/20"
                                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                                )}>
                                    {isActive && !isCurrent ? <Check size={16} /> : s}
                                </div>
                                {s < 4 && (
                                    <div className={clsx(
                                        "h-1 w-12 rounded-full transition-colors duration-300",
                                        step > s ? "bg-purple-600" : "bg-[var(--color-border)]"
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <Card className="border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                <CardContent className="p-8">
                    {/* STEP 1: Details */}
                    {step === 1 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <CalendarIcon className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Basisgegevens</h2>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Stel de naam en het jaar in voor het nieuwe rooster.</p>
                                </div>
                            </div>

                            <Input
                                label="Naam"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Bijv. Rooster 2026"
                                autoFocus
                            />

                            <Input
                                label="Jaargang"
                                type="number"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value))}
                            />
                        </div>
                    )}

                    {/* STEP 2: Volunteers */}
                    {step === 2 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Users className="text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Selecteer Vrijwilligers</h2>
                                        <p className="text-sm text-[var(--color-text-secondary)]">Kies wie er beschikbaar is voor dit rooster.</p>
                                    </div>
                                </div>
                                <Badge variant="outline">{selectedVolunteers.size} geselecteerd</Badge>
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-[var(--color-border)] rounded-xl p-2 bg-[var(--color-bg-app)] custom-scrollbar">
                                {allVolunteers.map(v => (
                                    <label key={v.id} className="flex items-center justify-between p-3 hover:bg-[var(--color-bg-surface)] rounded-lg cursor-pointer transition-colors group">
                                        <span className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                selectedVolunteers.has(v.id)
                                                    ? "bg-purple-600 border-purple-600 text-white"
                                                    : "border-[var(--color-text-muted)] group-hover:border-purple-400"
                                            )}>
                                                {selectedVolunteers.has(v.id) && <Check size={12} />}
                                            </div>
                                            <span className={clsx("font-medium", selectedVolunteers.has(v.id) ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]")}>
                                                {v.name}
                                            </span>
                                            {/* Hidden checkbox for accessibility */}
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedVolunteers.has(v.id)}
                                                onChange={() => toggleVolunteer(v.id)}
                                            />
                                        </span>
                                        {v.allow_double && <Badge variant="warning" className="text-xs">Mag dubbel</Badge>}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Dates */}
                    {step === 3 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <CalendarIcon className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Inzameldata</h2>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Controleer de data (standaard 1e zaterdag v/d maand).</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dates.map((date, i) => (
                                    <div key={i}>
                                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block ml-1">
                                            {new Date(0, i).toLocaleString('nl-NL', { month: 'long' })}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary-end)] focus:ring-1 focus:ring-[var(--color-primary-end)] transition-all"
                                            value={date}
                                            onChange={e => handleDateChange(i, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Confirm */}
                    {step === 4 && (
                        <div className="animate-fade-in space-y-8 text-center py-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-900/30">
                                <Wand2 size={40} className="text-white" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold mb-2">Klaar om te genereren?</h2>
                                <p className="text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                                    We gaan nu een concept-rooster maken voor <strong className="text-white">{name}</strong> met <strong className="text-white">{selectedVolunteers.size}</strong> vrijwilligers over <strong className="text-white">{dates.filter(d => d).length}</strong> dagen.
                                </p>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-left text-sm text-yellow-200/80 flex gap-3 max-w-lg mx-auto">
                                <div className="shrink-0 mt-0.5">⚠️</div>
                                <div>
                                    <strong>Let op:</strong> Dit is een eerste opzet op basis van eerlijke verdeling. Je kunt hierna alles nog handmatig aanpassen in de editor.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1}
                            className={step === 1 ? 'invisible' : ''}
                            icon={<ArrowLeft size={16} />}
                        >
                            Vorige
                        </Button>

                        {step < 4 ? (
                            <Button onClick={handleNext} variant="primary">
                                Volgende <ArrowRight size={16} className="ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={generateAndSave} loading={loading} variant="primary" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none shadow-lg shadow-purple-900/40">
                                {loading ? 'Genereren...' : 'Genereer Rooster'} <Wand2 size={16} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
