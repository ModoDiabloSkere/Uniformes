import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SearchSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  required?: boolean
}

export function SearchSelect({ label, value, onChange, options, placeholder, required }: SearchSelectProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label || ''
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  function handleFocus() {
    setSearch('')
    setOpen(true)
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150)
  }

  function select(opt: Option) {
    onChange(opt.value)
    setSearch('')
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <input
          value={open ? search : selectedLabel}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={open ? 'Buscar...' : (placeholder || '')}
          required={required && !value}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && !open && (
            <button type="button" onClick={clear} className="text-gray-300 hover:text-gray-500">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">Sin resultados</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={() => select(o)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  o.value === value
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
