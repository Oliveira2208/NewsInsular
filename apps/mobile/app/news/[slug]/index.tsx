import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, Share, Dimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Share as ShareIcon } from 'lucide-react-native'
import { useSupabase } from '@/providers/supabase'
import { formatDate } from '../src/utils'
import type { News } from '../src/types'

const { width } = Dimensions.get('window')

export default function NewsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const supabase = useSupabase()
  const [news, setNews] = useState<News | null>(null)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    if (slug) fetchNews()
  }, [slug])

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news')
      .select('*, images:news_images(*), category:categories(*)')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    setNews(data)
  }

  const handleShare = async () => {
    if (!news) return
    await Share.share({
      message: `${news.title}\n\n${news.summary ?? ''}\n\n${window.location.origin}/news/${news.slug}`,
    })
  }

  if (!news) return <View className="flex-1 items-center justify-center"><Text>Cargando...</Text></View>

  const images = news.images?.sort((a, b) => a.position - b.position) ?? []

  return (
    <ScrollView className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="absolute top-4 left-4 z-10 bg-black/50 rounded-full p-2">
        <ChevronLeft color="white" />
      </TouchableOpacity>

      {images.length > 0 && (
        <View className="relative">
          <Image
            source={{ uri: images[currentImage].url }}
            className="w-full h-64"
            resizeMode="cover"
          />
          {images.length > 1 && (
            <>
              <TouchableOpacity
                onPress={() => setCurrentImage((p) => (p > 0 ? p - 1 : images.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
              >
                <ChevronLeft color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurrentImage((p) => (p < images.length - 1 ? p + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
              >
                <ChevronRight color="white" />
              </TouchableOpacity>
              <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex-row gap-2">
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentImage(i)}
                    className={`w-3 h-3 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View className="p-4">
        {news.category && (
          <Text className="text-sm font-medium text-blue-600 bg-blue-50 self-start px-3 py-1 rounded-full mb-4">
            {news.category.name}
          </Text>
        )}

        <Text className="text-2xl font-bold text-gray-900 mb-2">{news.title}</Text>

        <View className="flex-row justify-between items-center mb-6 pb-4 border-b">
          <Text className="text-sm text-gray-500">{formatDate(news.created_at)}</Text>
          <TouchableOpacity onPress={handleShare} className="flex-row items-center gap-2 px-4 py-2 border rounded-lg">
            <ShareIcon size={18} color="#6b7280" />
            <Text className="text-gray-600">Compartir</Text>
          </TouchableOpacity>
        </View>

        {news.summary && (
          <Text className="text-lg text-gray-600 mb-6 font-medium">{news.summary}</Text>
        )}

        <Text className="text-base text-gray-800 leading-6">{news.content}</Text>
      </View>
    </ScrollView>
  )
}