import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../styles/colors'
import { typography } from '../styles/typography'
import { spacing, borderRadius, shadows } from '../styles/spacing'
import { Card, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { Showcase } from '../lib/database-types'

type ShowcasesScreenNavigationProp = StackNavigationProp<RootStackParamList>

const { width } = Dimensions.get('window')

// Use proper database type with additional fields for display
type ShowcaseWithImage = Showcase & {
  image_url: string
  title?: string
  description?: string
  category?: string
}

export default function ShowcasesScreen() {
  const navigation = useNavigation<ShowcasesScreenNavigationProp>()
  const [showcases, setShowcases] = useState<ShowcaseWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>(['all'])

  useEffect(() => {
    loadShowcases()
  }, [selectedCategory])

  const loadShowcases = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('showcases')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching showcases:', error)
      } else {
        setShowcases(data || [])
        
        // Extract unique categories
        const uniqueCategories = ['all', ...new Set(data?.map(s => s.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error loading showcases:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderCategoryTab = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryTab,
        selectedCategory === category && styles.categoryTabActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryTabText,
        selectedCategory === category && styles.categoryTabTextActive
      ]}>
        {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  )

  const renderShowcaseItem = ({ item }: { item: ShowcaseWithImage }) => (
    <TouchableOpacity style={styles.showcaseItem}>
      <Card style={styles.showcaseCard} variant="elevated">
        <Image source={{ uri: item.image_url }} style={styles.showcaseImage} />
        <View style={styles.showcaseContent}>
          <Text style={styles.showcaseTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.showcaseDescription} numberOfLines={3}>{item.description}</Text>
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
              )}
            </View>
          )}
          
          <View style={styles.showcaseFooter}>
            <Text style={styles.showcaseDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {item.category && (
              <Badge variant="outline" size="sm">
                {item.category}
              </Badge>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner}>
          <View style={styles.spinnerOuter} />
          <View style={styles.spinnerInner} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map(renderCategoryTab)}
      </ScrollView>

      {/* Showcases Grid */}
      <FlatList
        data={showcases}
        renderItem={renderShowcaseItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.showcasesGrid}
        columnWrapperStyle={styles.showcaseRow}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadShowcases}
      />

      {/* Empty State */}
      {showcases.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={48} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Showcases Yet</Text>
          <Text style={styles.emptyDescription}>
            {selectedCategory === 'all' 
              ? 'No showcases have been created yet. Be the first to showcase your work!'
              : `No showcases found in the ${selectedCategory} category.`
            }
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.emptyButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    backgroundColor: colors.background.primary,
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
  categoryTabs: {
    maxHeight: 60,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  categoryTabsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  categoryTabActive: {
    backgroundColor: colors.preset[500],
    borderColor: colors.preset[500],
  },
  categoryTabText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  categoryTabTextActive: {
    color: colors.text.inverse,
  },
  showcasesGrid: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  showcaseRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  showcaseItem: {
    width: (width - spacing.lg * 3) / 2,
  },
  showcaseCard: {
    padding: 0,
    overflow: 'hidden',
  },
  showcaseImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.gray[200],
  },
  showcaseContent: {
    padding: spacing.md,
  },
  showcaseTitle: {
    ...typography.h6,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  showcaseDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  moreTagsText: {
    ...typography.caption,
    color: colors.text.tertiary,
    alignSelf: 'center',
  },
  showcaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showcaseDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
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
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    maxWidth: width * 0.8,
  },
  emptyButton: {
    backgroundColor: colors.preset[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.medium,
  },
})
