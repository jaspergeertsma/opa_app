
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer, NotificationLog } from '../../types'
import { Mail, ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'


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

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-end)]"></div>
        </div>
    )
    if (!volunteer) return <div>Vrijwilliger niet gevonden</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/volunteers" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {volunteer.name}
                        {volunteer.active ? <Badge variant="success">Actief</Badge> : <Badge variant="error">Inactief</Badge>}
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-sm flex items-center gap-2">
                        <Mail size={14} /> {volunteer.email}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile Info */}
                <div className="space-y-6">
                    <Card className="border-[var(--color-border)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User size={18} className="text-purple-400" /> Profiel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                                <span className="text-[var(--color-text-secondary)] text-sm">Status</span>
                                <span>{volunteer.active ? <Badge variant="success">Actief</Badge> : <Badge variant="error">Inactief</Badge>}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                                <span className="text-[var(--color-text-secondary)] text-sm">Mag dubbel?</span>
                                <span>{volunteer.allow_double ? <Badge variant="outline">Ja</Badge> : <span className="text-[var(--color-text-muted)] text-sm">Nee</span>}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-[var(--color-text-secondary)] text-sm block mb-1.5 flex items-center gap-1"><FileText size={14} /> Notities</span>
                                <div className="bg-[var(--color-bg-app)] p-3 rounded-lg text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] min-h-[60px]">
                                    {volunteer.notes || <span className="text-[var(--color-text-muted)] italic">Geen notities</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Notifications Tab */}
                <div className="lg:col-span-2">
                    <Card className="border-[var(--color-border)] h-full">
                        <CardHeader className="pb-4 border-b border-[var(--color-border)]">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail size={18} className="text-purple-400" /> Notificatie Logboek
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-text-muted)]">
                                    Nog geen notificaties verstuurd.
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--color-border)]">
                                    {logs.map(log => (
                                        <div key={log.id} className="p-4 hover:bg-[var(--color-bg-app)] transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    {log.status === 'sent' && <div className="text-green-500"><CheckCircle size={18} /></div>}
                                                    {log.status === 'failed' && <div className="text-red-500"><XCircle size={18} /></div>}
                                                    {log.status === 'skipped' && <div className="text-yellow-500"><AlertTriangle size={18} /></div>}

                                                    <div>
                                                        <h4 className="font-medium text-[var(--color-text-primary)] text-sm">{log.subject}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge variant={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'} className="text-[10px] px-1.5 py-0 h-5">
                                                                {log.status.toUpperCase()}
                                                            </Badge>
                                                            {log.error && (
                                                                <span className="text-red-400 text-xs truncate max-w-[200px]">{log.error}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                                                    {new Date(log.sent_at).toLocaleString('nl-NL')}
                                                </span>
                                            </div>

                                            <div className="mt-3 pl-8">
                                                <details className="group/details">
                                                    <summary className="text-xs text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] flex items-center gap-1 select-none">
                                                        <span className="group-open/details:hidden">Toon inhoud</span>
                                                        <span className="hidden group-open/details:inline">Verberg inhoud</span>
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-[var(--color-bg-app)] rounded-lg text-xs font-mono whitespace-pre-wrap border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-inner">
                                                        {log.body_text}
                                                    </div>
                                                </details>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
