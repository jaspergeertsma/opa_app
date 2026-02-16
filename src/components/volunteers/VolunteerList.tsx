
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer } from '../../types'
import { Edit2, Trash2, Eye, UserPlus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

export default function VolunteerList() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Form state
    const [formData, setFormData] = useState<Partial<Volunteer>>({
        name: '',
        email: '',
        notes: '',
        allow_double: false,
        active: true
    })

    useEffect(() => {
        fetchVolunteers()
    }, [])

    const fetchVolunteers = async () => {
        const { data } = await supabase
            .from('volunteers')
            .select('*')
            .order('name')

        if (data) setVolunteers(data)
        setLoading(false)
    }

    const filteredVolunteers = volunteers.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email) return

        if (editingId) {
            const { error } = await supabase
                .from('volunteers')
                .update(formData)
                .eq('id', editingId)

            if (!error) {
                setEditingId(null)
                setFormData({ name: '', email: '', notes: '', allow_double: false, active: true })
                fetchVolunteers()
            }
        } else {
            const { error } = await supabase
                .from('volunteers')
                .insert(formData)

            if (!error) {
                setFormData({ name: '', email: '', notes: '', allow_double: false, active: true })
                fetchVolunteers()
            }
        }
    }

    const handleEdit = (v: Volunteer) => {
        setEditingId(v.id)
        setFormData(v)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Weet je zeker dat je deze vrijwilliger wilt verwijderen?')) return

        const { error } = await supabase
            .from('volunteers')
            .delete()
            .eq('id', id)

        if (!error) fetchVolunteers()
    }

    const handleCancel = () => {
        setEditingId(null)
        setFormData({ name: '', email: '', notes: '', allow_double: false, active: true })
    }

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-end)]"></div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Vrijwilligers</h1>
                    <p className="text-[var(--color-text-secondary)]">Beheer je team van vrijwilligers.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Zoeken..."
                            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-end)]"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-bg-surface)] p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[var(--color-bg-app)] text-[var(--color-text-secondary)] uppercase text-xs font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Naam</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Email</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredVolunteers.map((v) => (
                                        <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${v.active ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                                                        {v.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        {v.name}
                                                        <div className="md:hidden text-xs text-[var(--color-text-secondary)] mt-0.5">{v.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-[var(--color-text-secondary)]">
                                                {v.email}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {v.active ? (
                                                    <Badge variant="success">Actief</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="opacity-50">Inactief</Badge>
                                                )}
                                                {v.allow_double && (
                                                    <Badge variant="warning" className="ml-2">Dubbel</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/volunteers/${v.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                                                            <Eye size={20} />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full text-blue-400 hover:text-blue-300" onClick={() => handleEdit(v)}>
                                                        <Edit2 size={20} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full text-red-400 hover:text-red-300" onClick={() => handleDelete(v.id)}>
                                                        <Trash2 size={20} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredVolunteers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                                                Geen vrijwilligers gevonden.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Form Column */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-[var(--color-border)]">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg shadow-purple-900/20">
                                    <UserPlus size={18} className="text-white" />
                                </div>
                                <CardTitle>{editingId ? 'Bewerk Vrijwilliger' : 'Nieuwe Vrijwilliger'}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <Input
                                    label="Naam"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Volledige naam"
                                    required
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@voorbeeld.nl"
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Notities</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-primary-end)] transition-colors min-h-[100px]"
                                        placeholder="Optionele opmerkingen..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer group text-[var(--color-text-secondary)]">
                                        <input
                                            type="checkbox"
                                            checked={formData.allow_double || false}
                                            onChange={(e) => setFormData({ ...formData, allow_double: e.target.checked })}
                                            className="rounded border-[var(--color-border)] bg-[var(--color-bg-surface)] text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="group-hover:text-[var(--color-text-primary)] transition-colors">Mag dubbel</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer group text-[var(--color-text-secondary)]">
                                        <input
                                            type="checkbox"
                                            checked={formData.active !== false}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="rounded border-[var(--color-border)] bg-[var(--color-bg-surface)] text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="group-hover:text-[var(--color-text-primary)] transition-colors">Actief</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                                    <Button type="submit" variant="primary" className="flex-1">
                                        {editingId ? 'Opslaan' : 'Toevoegen'}
                                    </Button>
                                    {editingId && (
                                        <Button type="button" variant="ghost" onClick={handleCancel}>
                                            Annuleer
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
