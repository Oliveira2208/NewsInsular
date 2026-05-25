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
  published_at: string | null
  scheduled_for: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  author_id: string | null
  categories?: {
    categories: {
      id: string
      name: string
      slug: string
    }
  }[]
  images?: NewsImage[]
}

export interface NewsImage {
  id: string
  news_id: string
  url: string
  position: number
  created_at: string
}

export interface NewsCategory {
  news_id: string
  category_id: string
  position: number
}

export interface Person {
  id: number
  first_name: string
  last_name: string
  identity_doc: string
  birth_date: string
  phone: string
  email: string
  state_id: number
  municipality_id: number
  parish_id: number
  commune_id: number
  address: string
  push_token: string | null
  notifications_email: boolean
  unsubscribe_token: string | null
  created_at: string
  deleted_at: string | null
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