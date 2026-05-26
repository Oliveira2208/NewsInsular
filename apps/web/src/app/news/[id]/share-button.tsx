'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'

export default function ShareButton({ title, summary }: { title: string; summary: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title, text: summary || title, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
    >
      <Share2 className="w-4 h-4" />
      {copied ? '¡Copiado!' : 'Compartir'}
    </button>
  )
}