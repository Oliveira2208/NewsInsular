import { useState, useEffect } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Share } from 'lucide-react-native'
import { useSupabase } from '@/providers/supabase'
import { formatDate } from '../src/utils'
import type { News } from '../src/types'

const { width } = Dimensions.get('window')

export default function FeedScreen() {
  const supabase = useSupabase()
  const [news, setNews] = useState<News[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [{ data: cats }, { data: nws }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('news')
        .select('*, category:categories(*), images:news_images(*)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setCategories(cats ?? [])
    setNews(nws ?? [])
    setLoading(false)
  }

  const filteredNews = activeCategory
    ? news.filter((n) => n.category?.slug === activeCategory)
    : news

  const handleShare = async (news: News) => {
    const url = `https://tu-dominio.com/news/${news.slug}`
    const result = await Share.share({
      message: `${news.title}\n\n${news.summary ?? ''}\n\n${url}`,
    })
  }

  const renderNewsCard = ({ item }: { item: News }) => {
    const images = item.images?.sort((a, b) => a.position - b.position) ?? []
    return (
      <TouchableOpacity
        className="bg-white rounded-xl mb-4 shadow-sm"
        onPress={() => router.push(`/news/${item.slug}`)}
      >
        {images.length > 0 && (
          <View className="relative">
            <Image
              source={{ uri: images[0].url }}
              className="w-full h-48 rounded-t-xl"
              resizeMode="cover"
            />
          </View>
        )}
        <View className="p-4">
          {item.category && (
            <Text className="text-xs font-medium text-blue-600 bg-blue-50 self-start px-2 py-1 rounded-full mb-2">
              {item.category.name}
            </Text>
          )}
          <Text className="text-lg font-semibold text-gray-900 mb-2">{item.title}</Text>
          {item.summary && (
            <Text className="text-sm text-gray-600 mb-3 line-clamp-2">{item.summary}</Text>
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-gray-400">{formatDate(item.created_at)}</Text>
            <TouchableOpacity onPress={() => handleShare(item)} className="p-2">
              <Share size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderCategoryPill = (cat: { id: string; name: string; slug: string } | null, label: string) => {
    const isActive = cat ? activeCategory === cat.slug : !activeCategory
    return (
      <TouchableOpacity
        key={cat?.id ?? 'all'}
        onPress={() => setActiveCategory(cat?.slug ?? null)}
        className={`px-4 py-2 rounded-full mr-2 ${isActive ? 'bg-blue-600' : 'bg-gray-100'}`}
      >
        <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">NewsInsular</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categories]}
          keyExtractor={(item) => item?.id ?? 'all'}
          renderItem={({ item }) => renderCategoryPill(item, item?.name ?? 'Todas')}
        />
      </View>

      <FlatList
        data={filteredNews}
        keyExtractor={(item) => item.id}
        renderItem={renderNewsCard}
        contentContainerClassName="p-4"
        refreshing={loading}
        onRefresh={fetchData}
      />
    </View>
  )
}