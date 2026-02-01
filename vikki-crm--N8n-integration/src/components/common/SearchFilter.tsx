import { useMemo } from 'react'
import { Search } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SearchFilterProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options?: Option[]
  selectedOptions?: string[]
  onOptionsChange?: (values: string[]) => void
}

export default function SearchFilter({ value, onChange, placeholder = 'Search...', options = [], selectedOptions = [], onOptionsChange }: SearchFilterProps) {
  const hasFilters = useMemo(() => (options?.length || 0) > 0, [options])

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
      <div className="relative w-full sm:w-80">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const isActive = selectedOptions?.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (!onOptionsChange) return
                  const next = isActive ? selectedOptions.filter(v => v !== opt.value) : [...selectedOptions, opt.value]
                  onOptionsChange(next)
                }}
                className={`px-3 py-1 rounded-full text-sm border ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


