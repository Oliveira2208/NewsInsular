export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface News {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  published: boolean
  category_id: string | null
  created_at: string
  updated_at: string
  author_id: string | null
  category?: Category
  images?: NewsImage[]
}

export interface NewsImage {
  id: string
  news_id: string
  url: string
  position: number
  created_at: string
}

export interface Person {
  id: number
  identity_doc: string
  first_name: string
  last_name: string
  phone: string | null
  email: string
  birth_date: string | null
  state_id: number | null
  municipality_id: number | null
  parish_id: number | null
  commune_id: number | null
  notifications_email: boolean
  fcm_token: string | null
  created_at: string
}

export interface Notification {
  id: string
  person_id: string
  news_id: string | null
  title: string
  body: string | null
  read: boolean
  created_at: string
  news?: News
}

export interface RegisterFormData {
  full_name: string
  identity_prefix: 'V' | 'E' | 'P'
  identity_number: string
  birth_date: string
  phone: string
  email: string
  state: string
  municipality: string
  parish: string
  commune: string
  address: string
}