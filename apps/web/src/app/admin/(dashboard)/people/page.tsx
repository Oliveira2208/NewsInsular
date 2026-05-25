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
    p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.identity_doc?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const exportExcel = useCallback(() => {
    import('xlsx').then(({ utils, writeFile }) => {
      const data = filteredPeople.map((p) => ({
        'Nombre': p.first_name,
        'Apellido': p.last_name,
        'Identidad': p.identity_doc,
        'Email': p.email,
        'Teléfono': p.phone,
        'Notificaciones': p.notifications_email ? 'Sí' : 'No',
        'Registrado': p.created_at,
      }))
      const ws = utils.json_to_sheet(data)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'People')
      writeFile(wb, `people-${new Date().toISOString().split('T')[0]}.xlsx`)
    })
  }, [filteredPeople])

  const exportPDF = useCallback(() => {
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then(() => {
        const { jsPDF } = jsPDFModule
        const doc = new jsPDF()
        doc.text('Personas Registradas', 14, 20)
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30)
        // @ts-expect-error - autoTable is added by jspdf-autotable plugin
        doc.autoTable({
          head: [['Nombre', 'Apellido', 'Identidad', 'Email', 'Teléfono', 'Notificaciones']],
          body: filteredPeople.map((p) => [p.first_name, p.last_name, p.identity_doc, p.email, p.phone, p.notifications_email ? 'Sí' : 'No']),
          startY: 40,
        })
        doc.save(`people-${new Date().toISOString().split('T')[0]}.pdf`)
      })
    })
  }, [filteredPeople])

  const copyCSV = useCallback(async () => {
    const headers = ['Nombre', 'Apellido', 'Identidad', 'Email', 'Teléfono', 'Notificaciones']
    const rows = filteredPeople.map((p) => [p.first_name, p.last_name, p.identity_doc, p.email, p.phone, p.notifications_email ? 'Sí' : 'No'])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    await navigator.clipboard.writeText(csv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [filteredPeople])

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Personas Registradas</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={copyCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            {copied ? '¡Copiado!' : 'CSV'}
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
            placeholder="Buscar por nombre, identidad o email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notificaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPeople.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{p.first_name} {p.last_name}</td>
                <td className="px-6 py-4 text-gray-600">{p.identity_doc}</td>
                <td className="px-6 py-4 text-gray-600">{p.email}</td>
                <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${p.notifications_email ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.notifications_email ? 'Sí' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredPeople.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                <p className="text-sm text-gray-500">{p.identity_doc}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${p.notifications_email ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {p.notifications_email ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">{p.email}</p>
              <p className="text-sm text-gray-500">{p.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}