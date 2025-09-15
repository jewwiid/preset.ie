import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { databaseService } from '../../lib/database-service'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { colors } from '../../styles/colors'
import { typography } from '../../styles/typography'
import { spacing, borderRadius, shadows } from '../../styles/spacing'
import { Card, Badge, Input } from '../../components/ui'
import { RootStackParamList } from '../../navigation'
import { GigWithProfile, GigFilters } from '../../lib/database-types'

type GigsScreenNavigationProp = StackNavigationProp<RootStackParamList>

// Use the proper database type
type Gig = GigWithProfile

export default function GigsScreen() {
  const navigation = useNavigation<GigsScreenNavigationProp>()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const filters: GigFilters = {
        status: 'PUBLISHED'
      }

      // Apply filters
      if (selectedFilter !== 'all') {
        filters.comp_type = selectedFilter.toUpperCase() as any
      }

      // Apply search
      if (searchQuery.trim()) {
        filters.search = searchQuery
      }

      const { data, error } = await databaseService.gig.getGigs(filters)

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

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    // Debounce search
    setTimeout(() => {
      if (text === searchQuery) {
        fetchGigs()
      }
    }, 500)
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
    fetchGigs()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCompTypeColor = (type: string) => {
    switch (type) {
      case 'PAID':
        return colors.success
      case 'TFP':
        return colors.info
      case 'EXPENSES':
        return colors.warning
      default:
        return colors.gray[500]
    }
  }

  const getCompTypeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
    switch (type) {
      case 'PAID':
        return 'success'
      case 'TFP':
        return 'default'
      case 'EXPENSES':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const renderFilterChip = (filter: string, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipActive
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text style={[
        styles.filterChipText,
        selectedFilter === filter && styles.filterChipTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const renderGigCard = ({ item }: { item: Gig }) => (
    <TouchableOpacity
      style={styles.gigCard}
      onPress={() => navigation.navigate('GigDetail', { gigId: item.id })}
    >
      <Card style={styles.gigCardContent} variant="elevated">
        {/* Gig Image or Placeholder */}
        <View style={styles.imageContainer}>
          {(item.moodboard_url || (item.moodboard_urls && item.moodboard_urls.length > 0)) ? (
            <Image 
              source={{ uri: item.moodboard_url || item.moodboard_urls?.[0] }} 
              style={styles.gigImage} 
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color={colors.text.tertiary} />
            </View>
          )}
          <View style={styles.compTypeBadge}>
            <Badge variant={getCompTypeVariant(item.comp_type)} size="sm">
              {item.comp_type}
            </Badge>
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
                <Ionicons name="checkmark-circle" size={14} color={colors.info} />
              </View>
            )}
          </View>

          {/* Location & Date */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>
                {item.city}, {item.country}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
            </View>
          </View>

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.preset[500]} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <View style={styles.spinnerOuter} />
            <View style={styles.spinnerInner} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search gigs..."
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={<Ionicons name="search-outline" size={20} color={colors.text.tertiary} />}
          style={styles.searchInput}
        />
        
        <View style={styles.filtersContainer}>
          {renderFilterChip('all', 'All')}
          {renderFilterChip('paid', 'Paid')}
          {renderFilterChip('tfp', 'TFP')}
          {renderFilterChip('expenses', 'Expenses')}
        </View>
      </View>

      <FlatList
        data={gigs}
        renderItem={renderGigCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.preset[500]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Gigs Available</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No gigs match your search criteria' : 'Check back later for new opportunities'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    position: 'relative',
  },
  spinnerOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.preset[200],
  },
  spinnerInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.preset[500],
    borderTopColor: 'transparent',
  },
  searchSection: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  filterChipActive: {
    backgroundColor: colors.preset[500],
    borderColor: colors.preset[500],
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  gigCard: {
    marginBottom: spacing.lg,
  },
  gigCardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  gigImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compTypeBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  gigContent: {
    padding: spacing.lg,
  },
  gigTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  creatorName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  verifiedBadge: {
    marginLeft: spacing.xs,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    marginTop: spacing.sm,
    marginHorizontal: -spacing.lg,
  },
  applyButtonText: {
    ...typography.bodySmall,
    color: colors.preset[500],
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})