
import { Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AppSettings } from '../../types'
import PageHeader from '../common/PageHeader'

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState<{ subject: string, body: string } | null>(null)

    const [formData, setFormData] = useState<AppSettings>({
        admin_email: '',
        admin_name: '',
        cc_email_1: '',
        cc_email_2: '',
        subject_template: '',
        text_template: '',
        timezone: 'Europe/Amsterdam'
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const { data } = await supabase.from('app_settings').select('*')
        if (data) {
            // Convert Array<{key,value}> to Object
            const settingsObj: any = {}
            data.forEach((row: any) => {
                settingsObj[row.key] = row.value
            })
            setFormData(prev => ({ ...prev, ...settingsObj }))
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        // Convert Object back to Upsert Array
        const rows = Object.entries(formData).map(([key, value]) => ({ key, value }))

        const { error } = await supabase.from('app_settings').upsert(rows)
        if (error) {
            alert('Error saving settings: ' + error.message)
        } else {
            // Show success toast? For now just alert or nothing
        }
        setSaving(false)
    }

    const handlePreview = () => {
        // Client-side mock render
        let sub = formData.subject_template
        let body = formData.text_template

        const replacements: Record<string, string> = {
            '{SALUTATION}': 'Jan',
            '{DATE}': '12 februari 2026',
            '{ROLE}': 'V1',
            '{TIME_START}': '08:30',
            '{TIME_END}': '12:00',
            '{ADMIN_NAME}': formData.admin_name,
            '{ADMIN_EMAIL}': formData.admin_email
        }

        Object.entries(replacements).forEach(([key, val]) => {
            sub = sub.replace(new RegExp(key, 'g'), val)
            body = body.replace(new RegExp(key, 'g'), val)
        })

        setPreview({ subject: sub, body })
    }

    if (loading) return <div>Laden...</div>

    return (
        <div>
            <PageHeader
                title="Instellingen"
                subtitle="Beheer e-mail templates en algemene configuratie"
                icon={<Settings size={24} />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Configuration Form */}
                <div className="space-y-6">

                    <div className="card bg-white p-6">
                        <h3 className="font-bold text-lg mb-4">Algemeen & Admin</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Naam Admin</label>
                                <input
                                    type="text"
                                    value={formData.admin_name}
                                    onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Admin (Login)</label>
                                <input
                                    type="text"
                                    value={formData.admin_email}
                                    onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Let op: dit wijzigt wie toegang heeft!</p>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white p-6">
                        <h3 className="font-bold text-lg mb-4">E-mail Notificaties</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">CC Email 1</label>
                                    <input
                                        type="text"
                                        value={formData.cc_email_1}
                                        onChange={e => setFormData({ ...formData, cc_email_1: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">CC Email 2</label>
                                    <input
                                        type="text"
                                        value={formData.cc_email_2}
                                        onChange={e => setFormData({ ...formData, cc_email_2: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Onderwerp Template</label>
                                <input
                                    type="text"
                                    value={formData.subject_template}
                                    onChange={e => setFormData({ ...formData, subject_template: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Bericht Template (Plain Text)</label>
                                <textarea
                                    rows={8}
                                    className="font-mono text-sm"
                                    value={formData.text_template}
                                    onChange={e => setFormData({ ...formData, text_template: e.target.value })}
                                />
                                <div className="mt-2 text-xs text-slate-500">
                                    Beschikbare tags: {'{SALUTATION}, {DATE}, {ROLE}, {TIME_START}, {TIME_END}'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white p-6 border-l-4 border-indigo-500">
                        <h3 className="font-bold text-lg mb-4 text-indigo-900">Test Herinneringen</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Stuur handmatig de herinneringsmails voor een specifieke ophaaldatum.
                            Gebruik dit om te testen of de templates goed werken.
                            <br /><span className="font-bold text-green-600">✅ VEILIG: Test-mails worden alleen naar het admin-adres gestuurd.</span>
                        </p>

                        <div className="flex gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium mb-1">Selecteer Ophaaldatum</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    id="testDate"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    const dateEl = document.getElementById('testDate') as HTMLInputElement
                                    if (!dateEl.value) return alert('Kies eerst een datum')

                                    if (!confirm(`Weet je zeker dat je mails wilt sturen voor ${dateEl.value}?`)) return;

                                    try {
                                        const res = await fetch(`/.netlify/functions/scheduled-reminder?date=${dateEl.value}`)
                                        const txt = await res.text()
                                        alert('Resultaat: ' + txt)
                                    } catch (err: any) {
                                        alert('Fout tijdens versturen: ' + err.message)
                                    }
                                }}
                                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Verstuur Nu
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                        </button>
                        <button
                            onClick={handlePreview}
                            className="btn btn-secondary"
                        >
                            Update Preview
                        </button>
                    </div>

                </div>

                {/* RIGHT: Preview */}
                <div>
                    {preview ? (
                        <div className="sticky top-8">
                            <h3 className="font-bold text-lg mb-4 text-slate-500 uppercase text-xs tracking-wider">Preview</h3>
                            <div className="card bg-white p-0 overflow-hidden border-2 border-slate-100">
                                <div className="bg-slate-50 p-4 border-b border-slate-100">
                                    <div className="text-sm font-bold text-slate-700">{preview.subject}</div>
                                    <div className="text-xs text-slate-400 mt-1">Aan: Jan de Vries &lt;jan@example.com&gt;</div>
                                </div>
                                <div className="p-6 whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                    {preview.body}
                                </div>
                            </div>
                            <p className="text-center mt-4 text-xs text-slate-400">
                                Dit is een voorbeeld van hoe de mail eruit ziet voor een vrijwilliger.
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12">
                            Klik op "Update Preview" om het resultaat te zien.
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
