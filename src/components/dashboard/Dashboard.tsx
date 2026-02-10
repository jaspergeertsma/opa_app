
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Schedule } from '../../types'
import { Plus, Calendar, Clock, ArrowRight } from 'lucide-react'


import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

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

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-end)]"></div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Roosters
                    </h1>
                    <p className="text-[var(--color-text-secondary)] max-w-2xl">
                        Beheer de jaarplanningen en inzameldagen voor alle wijken.
                    </p>
                </div>
                <Link to="/schedule/new">
                    <Button variant="cta" icon={<Plus size={18} />}>
                        Nieuw Rooster
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((schedule) => (
                    <Link key={schedule.id} to={`/schedule/${schedule.id}`} className="group no-underline block h-full">
                        <Card className="h-full hover:border-[var(--color-primary-end)] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] bg-[var(--color-bg-surface)] group-hover:-translate-y-1">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                                        <Calendar size={24} />
                                    </div>
                                    {schedule.is_active && (
                                        <Badge variant="success">Actief</Badge>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--color-primary-end)] transition-colors">
                                    {schedule.name}
                                </h3>

                                <div className="flex items-center text-sm text-[var(--color-text-muted)] mb-6">
                                    <Clock size={14} className="mr-2" />
                                    <span>Jaargang {schedule.year}</span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">Bekijk details</span>
                                    <ArrowRight size={16} className="text-[var(--color-primary-end)] transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {schedules.length === 0 && (
                    <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/50">
                        <div className="mx-auto w-16 h-16 bg-[var(--color-bg-surface)] rounded-full flex items-center justify-center mb-4 text-[var(--color-text-secondary)]">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Nog geen roosters</h3>
                        <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
                            Er zijn nog geen roosters aangemaakt. Begin met het maken van de planning voor dit jaar.
                        </p>
                        <Link to="/schedule/new">
                            <Button variant="secondary">
                                Maak je eerste rooster
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
