import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function validateIdentityDoc(value: string): boolean {
  return /^[VEP]-\d{6,9}$/.test(value)
}

export function formatIdentityDoc(prefix: string, number: string): string {
  return `${prefix}-${number}`
}

export const VENEZUELA_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
  'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
  'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
  'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
  'Trujillo', 'La Guajira', 'Vargas', 'Yaracuy', 'Zulia'
] as const