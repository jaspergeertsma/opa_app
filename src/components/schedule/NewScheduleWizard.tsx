
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer } from '../../types'
import { generateSchedule } from '../../lib/scheduler'
import { ArrowRight, ArrowLeft, Calendar as CalendarIcon, Users, Wand2 } from 'lucide-react'

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
        supabase.from('volunteers').select('*').eq('active', true).then(({ data }) => {
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
            const result = generateSchedule(year, validDates, pool)

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
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Nieuw Rooster</h1>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-2 w-12 rounded-full ${step >= s ? 'bg-primary-600' : 'bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="card bg-white p-8">

                {/* STEP 1: Details */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <CalendarIcon className="text-primary-600" /> Basisgegevens
                        </h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Naam</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Rooster 2026" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Jaargang</label>
                            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} />
                        </div>
                    </div>
                )}

                {/* STEP 2: Volunteers */}
                {step === 2 && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Users className="text-primary-600" /> Selecteer Vrijwilligers
                        </h2>
                        <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-md p-2">
                            {allVolunteers.map(v => (
                                <label key={v.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <span className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedVolunteers.has(v.id)}
                                            onChange={() => toggleVolunteer(v.id)}
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        {v.name}
                                    </span>
                                    {v.allow_double && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Mag dubbel</span>}
                                </label>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 text-right">
                            {selectedVolunteers.size} geselecteerd
                        </p>
                    </div>
                )}

                {/* STEP 3: Dates */}
                {step === 3 && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <CalendarIcon className="text-primary-600" /> Inzameldata
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Voer de 12 zaterdagen in voor dit rooster.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {dates.map((date, i) => (
                                <div key={i}>
                                    <label className="text-xs text-slate-400 mb-1 block">Datum {i + 1}</label>
                                    <input
                                        type="date"
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
                    <div className="animate-fade-in space-y-6 text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-600">
                            <Wand2 size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Klaar om te genereren?</h2>
                            <p className="text-slate-500 mt-2">
                                We gaan nu een concept-rooster maken voor <strong>{name}</strong> met <strong>{selectedVolunteers.size}</strong> vrijwilligers over <strong>{dates.filter(d => d).length}</strong> dagen.
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-left text-sm text-yellow-800">
                            <strong>Let op:</strong> Dit is een eerste opzet op basis van eerlijke verdeling. Je kunt hierna alles nog handmatig aanpassen in de editor.
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <button
                        disabled={step === 1}
                        onClick={handleBack}
                        className={`btn btn-ghost ${step === 1 ? 'invisible' : ''}`}
                    >
                        <ArrowLeft size={16} /> Vorige
                    </button>

                    {step < 4 ? (
                        <button onClick={handleNext} className="btn btn-primary">
                            Volgende <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button onClick={generateAndSave} disabled={loading} className="btn btn-primary">
                            {loading ? 'Genereren...' : 'Genereer Rooster'} <Wand2 size={16} />
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
