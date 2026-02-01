import { useEffect, useMemo, useState } from 'react'
import { CarFront, Plus } from 'lucide-react'
import SearchFilter from '../common/SearchFilter'
import { fetchAutoInsurers, createAutoInsurer } from '../../utils/database'

export default function AutoInsuranceHub() {
  const [query, setQuery] = useState('')
  const [insurers, setInsurers] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<any>({ name: '', phone: '', city: '', state: 'OK' })

  useEffect(() => { load() }, [])
  async function load() { setInsurers(await fetchAutoInsurers()) }

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    return insurers.filter(i => !term || i.name?.toLowerCase().includes(term) || i.state?.toLowerCase().includes(term) || i.city?.toLowerCase().includes(term) || i.phone?.toLowerCase().includes(term))
  }, [insurers, query])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsAdding(false)
    await createAutoInsurer(form)
    setForm({ name: '', phone: '', city: '', state: 'OK' })
    await load()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <CarFront className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Auto Insurance</h3>
        </div>
        <button onClick={()=>setIsAdding(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Auto Insurance
        </button>
      </div>
      <div className="p-4 space-y-4">
        <SearchFilter value={query} onChange={setQuery} placeholder="Search name, city, state, phone" />
        <ul className="divide-y border rounded-lg">
          {filtered.map(i => (
            <li key={i.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{i.name}</p>
                <p className="text-xs text-gray-600">{[i.city, i.state].filter(Boolean).join(', ')} {i.phone ? `• ${i.phone}` : ''}</p>
              </div>
              <span className="text-xs text-gray-500">ID: {i.id}</span>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-500">No auto insurers match your search</li>
          )}
        </ul>
      </div>
      {isAdding && (
        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded" />
            <input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border rounded" />
            <input placeholder="City" value={form.city} onChange={(e)=>setForm({ ...form, city: e.target.value })} className="px-3 py-2 border rounded" />
            <input placeholder="State" value={form.state} onChange={(e)=>setForm({ ...form, state: e.target.value })} className="px-3 py-2 border rounded" />
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


