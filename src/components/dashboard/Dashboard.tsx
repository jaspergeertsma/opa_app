
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Schedule } from '../../types'
import { Plus, Calendar } from 'lucide-react'

import PageHeader from '../common/PageHeader'

export default function Dashboard() {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSchedules()
    }, [])

    const fetchSchedules = async () => {
        const { data } = await supabase
            .from('schedules')
            .select('*')
            .order('year', { ascending: false })
            .order('created_at', { ascending: false })

        if (data) setSchedules(data)
        setLoading(false)
    }

    if (loading) return <div>Laden...</div>

    return (
        <div>
            <PageHeader
                title="Roosters"
                subtitle="Beheer de jaarplanningen en inzameldagen."
                actions={
                    <Link to="/schedule/new" className="btn btn-primary">
                        <Plus size={18} />
                        Nieuw Rooster
                    </Link>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((schedule) => (
                    <Link key={schedule.id} to={`/schedule/${schedule.id}`} className="card hover:shadow-lg transition-shadow bg-white block text-slate-900 no-underline">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">{schedule.name}</h2>
                            {schedule.is_active && (
                                <span className="badge badge-green">Actief</span>
                            )}
                        </div>
                        <p className="text-slate-500 mb-4">Jaargang: {schedule.year}</p>
                        <div className="text-sm text-slate-400">
                            Gemaakt op {new Date(schedule.created_at).toLocaleDateString('nl-NL')}
                        </div>
                    </Link>
                ))}

                {schedules.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-4">Nog geen roosters aanwezig.</p>
                        <Link to="/schedule/new" className="btn btn-secondary">
                            Maak je eerste rooster
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
