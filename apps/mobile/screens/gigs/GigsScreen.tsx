import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useNavigation } from '@react-navigation/native'

interface Gig {
  id: string
  title: string
  description: string
  comp_type: string
  location_text: string
  city: string
  country: string
  start_date: string
  application_deadline: string
  max_applicants: number
  moodboard_urls: string[]
  users_profile: {
    display_name: string
    avatar_url: string
    handle: string
    verified_id: boolean
  }
}

export default function GigsScreen() {
  const navigation = useNavigation()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          users_profile!owner_user_id (
            display_name,
            avatar_url,
            handle,
            verified_id
          )
        `)
        .eq('status', 'PUBLISHED')
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setGigs(data || [])
    } catch (error) {
      console.error('Error fetching gigs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchGigs()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCompTypeColor = (type: string) => {
    switch (type) {
      case 'PAID':
        return '#10B981'
      case 'TFP':
        return '#3B82F6'
      case 'EXPENSES':
        return '#8B5CF6'
      default:
        return '#6B7280'
    }
  }

  const renderGigCard = ({ item }: { item: Gig }) => (
    <TouchableOpacity
      style={styles.gigCard}
      onPress={() => navigation.navigate('GigDetail' as never, { gigId: item.id } as never)}
    >
      {/* Gig Image or Placeholder */}
      <View style={styles.imageContainer}>
        {item.moodboard_urls && item.moodboard_urls.length > 0 ? (
          <Image source={{ uri: item.moodboard_urls[0] }} style={styles.gigImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={40} color="#9CA3AF" />
          </View>
        )}
        <View style={[styles.compTypeBadge, { backgroundColor: getCompTypeColor(item.comp_type) }]}>
          <Text style={styles.compTypeText}>{item.comp_type}</Text>
        </View>
      </View>

      {/* Gig Details */}
      <View style={styles.gigContent}>
        <Text style={styles.gigTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Creator Info */}
        <View style={styles.creatorInfo}>
          <Image
            source={{ uri: item.users_profile.avatar_url || 'https://via.placeholder.com/30' }}
            style={styles.avatar}
          />
          <Text style={styles.creatorName}>{item.users_profile.display_name}</Text>
          {item.users_profile.verified_id && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
            </View>
          )}
        </View>

        {/* Location & Date */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {item.city}, {item.country}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(item.start_date)}</Text>
          </View>
        </View>

        {/* Apply Button */}
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={gigs}
        renderItem={renderGigCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Gigs Available</Text>
            <Text style={styles.emptyText}>Check back later for new opportunities</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  gigCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gigImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  compTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  gigContent: {
    padding: 16,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorName: {
    fontSize: 14,
    color: '#6B7280',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    marginHorizontal: -16,
  },
  applyButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
})