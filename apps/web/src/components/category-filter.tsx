'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryFilterProps {
  categories: Category[]
  activeSlug?: string
}

export default function CategoryFilter({
  categories,
  activeSlug,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/"
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !activeSlug
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Todas
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/?category=${cat.slug}`}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSlug === cat.slug
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}