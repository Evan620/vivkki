import { useEffect, useMemo, useState } from 'react'
import { Plus, FolderTree } from 'lucide-react'
import SearchFilter from '../common/SearchFilter'
import { fetchMedicalProviders, createMedicalProvider } from '../../utils/database'

const TYPE_OPTIONS = [
  { value: 'Chiro', label: 'Chiro' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'PT', label: 'PT' },
  { value: 'Imaging', label: 'Imaging' },
  { value: 'Other', label: 'Other' }
]

export default function ProvidersHub() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [form, setForm] = useState<any>({ name: '', type: 'Other', city: '', state: 'OK', phone: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const res = await fetchMedicalProviders()
    setProviders(res)
  }

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    return providers.filter(p => (
      (!term || p.name?.toLowerCase().includes(term) || p.city?.toLowerCase().includes(term) || p.phone?.toLowerCase().includes(term)) &&
      (active.length === 0 || active.includes(p.type || 'Other'))
    ))
  }, [providers, query, active])

  const byType = useMemo(() => {
    const g: Record<string, any[]> = {}
    for (const p of filtered) {
      const key = p.type || 'Other'
      if (!g[key]) g[key] = []
      g[key].push(p)
    }
    // Sort each group alphabetically by name
    for (const key in g) {
      g[key].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    return g
  }, [filtered])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsAdding(false)
    await createMedicalProvider(form)
    setForm({ name: '', type: 'Other', city: '', state: 'OK', phone: '' })
    await load()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Medical Providers</h3>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>
      <div className="p-4 space-y-4">
        <SearchFilter value={query} onChange={setQuery} options={TYPE_OPTIONS} selectedOptions={active} onOptionsChange={setActive} placeholder="Search name, city, phone" />

        <div className="space-y-6">
          {Object.entries(byType).map(([type, list]) => (
            <div key={type} className="border rounded-lg">
              <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold text-gray-700">{type} · {list.length}</div>
              <ul className="divide-y">
                {list.map(p => (
                  <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-600">{[p.city, p.state].filter(Boolean).join(', ')}{p.phone ? ` • ${p.phone}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-500">ID: {p.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-8">No providers match your search</div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded" />
            <select value={form.type} onChange={(e)=>setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input placeholder="City" value={form.city} onChange={(e)=>setForm({ ...form, city: e.target.value })} className="px-3 py-2 border rounded" />
            <input placeholder="State" value={form.state} onChange={(e)=>setForm({ ...form, state: e.target.value })} className="px-3 py-2 border rounded" />
            <input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border rounded" />
            <div className="flex gap-2 col-span-full justify-end">
              <button type="button" onClick={()=>setIsAdding(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}


