import { Save, RefreshCw, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AppSettings } from '../../types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

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

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-end)]"></div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-1">Instellingen</h1>
                <p className="text-[var(--color-text-secondary)]">Beheer e-mail templates en algemene configuratie.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Configuration Form (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    <Card>
                        <CardHeader>
                            <CardTitle>Algemeen & Admin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                label="Naam Admin"
                                value={formData.admin_name}
                                onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                            />
                            <Input
                                label="Email Admin (Login)"
                                value={formData.admin_email}
                                onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                helperText="Let op: dit wijzigt wie toegang heeft!"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>E-mail Notificaties</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="CC Email 1"
                                    value={formData.cc_email_1}
                                    onChange={e => setFormData({ ...formData, cc_email_1: e.target.value })}
                                />
                                <Input
                                    label="CC Email 2"
                                    value={formData.cc_email_2}
                                    onChange={e => setFormData({ ...formData, cc_email_2: e.target.value })}
                                />
                            </div>

                            <Input
                                label="Onderwerp Template"
                                value={formData.subject_template}
                                onChange={e => setFormData({ ...formData, subject_template: e.target.value })}
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">Bericht Template (Plain Text)</label>
                                <textarea
                                    rows={8}
                                    className="w-full bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[var(--color-primary-end)] transition-colors"
                                    value={formData.text_template}
                                    onChange={e => setFormData({ ...formData, text_template: e.target.value })}
                                />
                                <div className="mt-2 text-xs text-[var(--color-text-muted)] p-2 bg-white/5 rounded-lg border border-[var(--color-border)]">
                                    <span className="font-semibold block mb-1">Beschikbare tags:</span>
                                    {'{SALUTATION}, {DATE}, {ROLE}, {TIME_START}, {TIME_END}'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-500/30 bg-indigo-500/5">
                        <CardHeader>
                            <CardTitle className="text-indigo-400">Test Herinneringen</CardTitle>
                            <CardDescription>Stuur handmatig de herinneringsmails voor een datum.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">Selecteer Ophaaldatum</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-primary-end)] transition-colors"
                                        id="testDate"
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={async () => {
                                        const dateEl = document.getElementById('testDate') as HTMLInputElement
                                        if (!dateEl.value) return alert('Kies eerst een datum')

                                        if (!confirm(`Weet je zeker dat je mails wilt sturen voor ${dateEl.value}?`)) return;

                                        try {
                                            const { data, error } = await supabase.functions.invoke('scheduled-reminder', {
                                                method: 'GET',
                                                queryParams: { date: dateEl.value }
                                            })
                                            if (error) throw error;
                                            alert('Resultaat: ' + (data?.message || 'Success'))
                                        } catch (err: any) {
                                            alert('Fout tijdens versturen: ' + (err.message || JSON.stringify(err)))
                                        }
                                    }}
                                >
                                    Verstuur Nu
                                </Button>
                            </div>
                            <p className="text-xs text-green-400 mt-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Test-mails worden alleen naar het admin-adres gestuurd.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            variant="primary"
                            icon={<Save size={18} />}
                        >
                            {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                        </Button>
                        <Button
                            onClick={handlePreview}
                            variant="secondary"
                            icon={<RefreshCw size={18} />}
                        >
                            Update Preview
                        </Button>
                    </div>

                </div>

                {/* RIGHT: Preview (1/3) */}
                <div className="lg:col-span-1">
                    {preview ? (
                        <div className="sticky top-24">
                            <h3 className="font-bold text-lg mb-4 text-[var(--color-text-secondary)] uppercase text-xs tracking-wider">Preview</h3>
                            <Card className="overflow-hidden bg-[#ffffff] text-slate-900 border-none">
                                <div className="bg-slate-50 p-4 border-b border-slate-200">
                                    <div className="text-sm font-bold text-slate-800">{preview.subject}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <Mail size={12} />
                                        Aan: Jan de Vries &lt;jan@example.com&gt;
                                    </div>
                                </div>
                                <div className="p-8 whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed max-w-none prose prose-sm">
                                    {preview.body}
                                </div>
                            </Card>
                            <p className="text-center mt-4 text-xs text-[var(--color-text-muted)]">
                                Dit is een voorbeeld van hoe de mail eruit ziet voor een vrijwilliger.
                            </p>
                        </div>
                    ) : (
                        <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-[var(--color-text-muted)] border-dashed bg-transparent">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <RefreshCw size={24} className="opacity-50" />
                            </div>
                            <p>Klik op "Update Preview" om het resultaat te zien.</p>
                        </Card>
                    )}
                </div>

            </div>
        </div>
    )
}
