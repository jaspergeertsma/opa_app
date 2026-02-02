
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer, NotificationLog } from '../../types'
import PageHeader from '../common/PageHeader'
import { Mail, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function VolunteerDetail() {
    const { id } = useParams()
    const [volunteer, setVolunteer] = useState<Volunteer | null>(null)
    const [logs, setLogs] = useState<NotificationLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)

        // Fetch Volunteer
        const { data: vData } = await supabase.from('volunteers').select('*').eq('id', id!).single()
        if (vData) setVolunteer(vData)

        // Fetch Logs
        const { data: lData } = await supabase
            .from('notification_logs')
            .select('*')
            .eq('volunteer_id', id!)
            .order('sent_at', { ascending: false })

        if (lData) setLogs(lData)

        setLoading(false)
    }

    if (loading) return <div>Laden...</div>
    if (!volunteer) return <div>Vrijwilliger niet gevonden</div>

    return (
        <div>
            <div className="mb-4">
                <Link to="/volunteers" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                    <ArrowLeft size={16} /> Terug naar overzicht
                </Link>
            </div>

            <PageHeader
                title={volunteer.name}
                subtitle={volunteer.email}
                icon={<div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{volunteer.name.substring(0, 2)}</div>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Profile Info */}
                <div className="space-y-6">
                    <div className="card bg-white p-6">
                        <h3 className="font-bold text-lg mb-4">Profiel</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-slate-50">
                                <span className="text-slate-500">Status</span>
                                <span>{volunteer.active ? <span className="badge badge-green">Actief</span> : <span className="badge badge-red">Inactief</span>}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-50">
                                <span className="text-slate-500">Mag dubbel?</span>
                                <span>{volunteer.allow_double ? 'Ja' : 'Nee'}</span>
                            </div>
                            <div className="py-2">
                                <span className="text-slate-500 block mb-1">Notities</span>
                                <p className="bg-slate-50 p-2 rounded text-slate-700">{volunteer.notes || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Notifications Tab */}
                <div className="lg:col-span-2">
                    <div className="card bg-white p-6">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Mail size={20} className="text-slate-400" /> Notificatie Logboek
                        </h3>

                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                Nog geen notificaties verstuurd.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map(log => (
                                    <div key={log.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                {log.status === 'sent' && <CheckCircle size={16} className="text-green-500" />}
                                                {log.status === 'failed' && <XCircle size={16} className="text-red-500" />}
                                                {log.status === 'skipped' && <AlertTriangle size={16} className="text-yellow-500" />}
                                                <span className="font-medium text-slate-900">{log.subject}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {new Date(log.sent_at).toLocaleString('nl-NL')}
                                            </span>
                                        </div>

                                        <div className="text-sm text-slate-600 mb-2">
                                            {/* Simple summary or preview */}
                                            <span className={`badge ${log.status === 'sent' ? 'badge-green' :
                                                    log.status === 'failed' ? 'badge-red' : 'badge-yellow'
                                                }`}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {log.error && (
                                            <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-2 font-mono">
                                                {log.error}
                                            </div>
                                        )}

                                        <details className="text-xs text-slate-500 cursor-pointer">
                                            <summary className="hover:text-primary-600">Toon email inhoud</summary>
                                            <div className="mt-2 p-3 bg-slate-50 rounded font-mono whitespace-pre-wrap border border-slate-200">
                                                {log.body_text}
                                            </div>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
