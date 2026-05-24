'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Person } from '@/lib/types'

export default function AdminPeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('people').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPeople(data ?? [])
      setLoading(false)
    })
  }, [])

  const fetchPeople = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('people').select('*').order('created_at', { ascending: false })
    setPeople(data ?? [])
    setLoading(false)
  }, [])

  const filteredPeople = people.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.identity_doc.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const exportExcel = useCallback(() => {
    import('xlsx').then(({ utils, writeFile }) => {
      const data = filteredPeople.map((p) => ({
        'Nombre': p.full_name,
        'Documento': p.identity_doc,
        'Fecha de nacimiento': p.birth_date,
        'Teléfono': p.phone,
        'Email': p.email,
        'Estado': p.state,
        'Municipio': p.municipality,
        'Parroquia': p.parish,
        'Comuna': p.commune,
        'Dirección': p.address,
        'Fecha de registro': p.created_at,
      }))
      const ws = utils.json_to_sheet(data)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Personas')
      writeFile(wb, `personas-registradas-${new Date().toISOString().split('T')[0]}.xlsx`)
    })
  }, [filteredPeople])

  const exportPDF = useCallback(() => {
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF.jsPDF()
        doc.text('Personas Registradas', 14, 20)
        doc.text(`Fecha: ${new Date().toLocaleDateString('es')}`, 14, 30)
        doc.autoTable({
          head: [['Nombre', 'Documento', 'Email', 'Teléfono', 'Estado']],
          body: filteredPeople.map((p) => [p.full_name, p.identity_doc, p.email, p.phone, p.state]),
          startY: 40,
        })
        doc.save(`personas-registradas-${new Date().toISOString().split('T')[0]}.pdf`)
      })
    })
  }, [filteredPeople])

  const copyCSV = useCallback(async () => {
    const headers = ['Nombre', 'Documento', 'Email', 'Teléfono', 'Estado', 'Municipio', 'Parroquia', 'Comuna']
    const rows = filteredPeople.map((p) => [p.full_name, p.identity_doc, p.email, p.phone, p.state, p.municipality, p.parish, p.commune])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    await navigator.clipboard.writeText(csv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [filteredPeople])

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Personas registradas</h1>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={copyCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, documento o email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPeople.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{p.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{p.identity_doc}</td>
                <td className="px-6 py-4 text-gray-600">{p.email}</td>
                <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                <td className="px-6 py-4 text-gray-600">{p.state}, {p.municipality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}