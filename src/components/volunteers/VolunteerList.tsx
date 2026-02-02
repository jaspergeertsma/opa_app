
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Volunteer } from '../../types'
import { Edit2, Trash2, Check, X, Eye } from 'lucide-react'

export default function VolunteerList() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

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

    if (loading) return <div>Laden...</div>

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Vrijwilligers</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="w-1/3">Naam</th>
                                    <th className="hidden md:table-cell">Email</th>
                                    <th className="text-center">Dubbel</th>
                                    <th className="text-center">Actief</th>
                                    <th className="text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.map((v) => (
                                    <tr key={v.id} className={!v.active ? 'opacity-50 bg-slate-50' : ''}>
                                        <td className="font-medium">
                                            {v.name}
                                            <div className="md:hidden text-xs text-slate-500">{v.email}</div>
                                        </td>
                                        <td className="hidden md:table-cell text-slate-500">{v.email}</td>
                                        <td className="text-center">
                                            {v.allow_double ? <Check size={16} className="text-green-500 inline" /> : <X size={16} className="text-slate-300 inline" />}
                                        </td>
                                        <td className="text-center">
                                            {v.active ? <span className="badge badge-green">Ja</span> : <span className="badge badge-red">Nee</span>}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`/volunteers/${v.id}`} className="btn btn-ghost btn-sm p-1 text-primary-600 hover:bg-primary-50">
                                                    <Eye size={16} />
                                                </Link>
                                                <button onClick={() => handleEdit(v)} className="btn btn-ghost btn-sm p-1">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(v.id)} className="btn btn-ghost btn-sm p-1 text-red-500 hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-24">
                    <h2 className="text-lg font-bold mb-4">{editingId ? 'Bewerk Vrijwilliger' : 'Nieuwe Vrijwilliger'}</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Naam</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Jan Janssen"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="jan@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notities</label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-md"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.allow_double || false}
                                    onChange={(e) => setFormData({ ...formData, allow_double: e.target.checked })}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                Mag dubbel
                            </label>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.active !== false}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                Actief
                            </label>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="btn btn-primary flex-1">
                                {editingId ? 'Opslaan' : 'Toevoegen'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Annuleer
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
