import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../styles/colors'
import { typography } from '../styles/typography'
import { spacing, borderRadius, shadows } from '../styles/spacing'
import { Button, Card } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { Gig, Showcase } from '../lib/database-types'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>

const { width } = Dimensions.get('window')

// Use proper database types
type FeaturedGig = Pick<Gig, 'id' | 'title' | 'description' | 'comp_type' | 'location_text' | 'created_at' | 'moodboard_url'>
type RecentShowcase = Pick<Showcase, 'id' | 'caption' | 'created_at'> & {
  image_url: string
  title?: string
  description?: string
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const [featuredGigs, setFeaturedGigs] = useState<FeaturedGig[]>([])
  const [recentShowcases, setRecentShowcases] = useState<RecentShowcase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      // Load featured gigs
      const { data: gigs, error: gigsError } = await supabase
        .from('gigs')
        .select('id, title, description, comp_type, location_text, created_at, moodboard_url')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })
        .limit(6)

      if (gigsError) {
        console.error('Error fetching gigs:', gigsError)
      } else {
        setFeaturedGigs(gigs || [])
      }

      // Load recent showcases
      const { data: showcases, error: showcasesError } = await supabase
        .from('showcases')
        .select('id, title, description, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(6)

      if (showcasesError) {
        console.error('Error fetching showcases:', showcasesError)
      } else {
        setRecentShowcases(showcases || [])
      }
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderFeatureCard = (icon: string, title: string, description: string) => (
    <Card key={title} style={styles.featureCard} variant="elevated">
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={28} color={colors.text.inverse} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Card>
  )

  const renderGigCard = (gig: FeaturedGig) => (
    <TouchableOpacity
      key={gig.id}
      style={styles.gigCard}
      onPress={() => navigation.navigate('GigDetail', { gigId: gig.id })}
    >
      <Card style={styles.gigCardContent} variant="elevated">
        {gig.moodboard_url && (
          <Image source={{ uri: gig.moodboard_url }} style={styles.gigImage} />
        )}
        <View style={styles.gigContent}>
          <Text style={styles.gigTitle} numberOfLines={2}>{gig.title}</Text>
          <Text style={styles.gigDescription} numberOfLines={2}>{gig.description}</Text>
          <View style={styles.gigMeta}>
            <Text style={styles.gigCompType}>{gig.comp_type}</Text>
            <Text style={styles.gigLocation}>{gig.location_text}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  const renderShowcaseCard = (showcase: RecentShowcase) => (
    <TouchableOpacity key={showcase.id} style={styles.showcaseCard}>
      <Card style={styles.showcaseCardContent} variant="elevated">
        <Image source={{ uri: showcase.image_url }} style={styles.showcaseImage} />
        <View style={styles.showcaseContent}>
          <Text style={styles.showcaseTitle} numberOfLines={1}>{showcase.title}</Text>
          <Text style={styles.showcaseDescription} numberOfLines={2}>{showcase.description}</Text>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
        </View>
        
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Where Creatives{'\n'}Connect & Create
          </Text>
          <Text style={styles.heroSubtitle}>
            The creative collaboration platform where Contributors post gigs and Talent applies. 
            Build your portfolio with Showcases. Free to start, subscription-based.
          </Text>
          
          <View style={styles.heroButtons}>
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.heroButton}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onPress={() => navigation.navigate('Gigs')}
              style={styles.heroButton}
            >
              Browse Gigs
            </Button>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>
          Everything You Need to <Text style={styles.gradientText}>Create</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          From finding the perfect creative partner to showcasing your best work, 
          Preset has all the tools you need.
        </Text>
        
        <View style={styles.featuresGrid}>
          {renderFeatureCard(
            'time-outline',
            'Post & Browse Gigs',
            'Contributors post creative gigs with beautiful moodboards. Talent browses and applies to projects they love.'
          )}
          {renderFeatureCard(
            'images-outline',
            'In-App Showcases',
            'Build your portfolio with Showcases created from completed shoots. Keep all your best work in one place.'
          )}
          {renderFeatureCard(
            'shield-checkmark-outline',
            'Safe & Trusted',
            'Built-in safety features including release forms, content moderation, and secure messaging for peace of mind.'
          )}
          {renderFeatureCard(
            'color-palette-outline',
            'Beautiful Moodboards',
            'Create stunning moodboards with AI-powered tags and color palettes. Make your gigs stand out and inspire.'
          )}
          {renderFeatureCard(
            'phone-portrait-outline',
            'Cross-Platform',
            'Access Preset on web, iOS, and Android with a consistent, beautiful experience across all devices.'
          )}
          {renderFeatureCard(
            'flash-outline',
            'Smart Matching',
            'AI-powered style matching connects you with the perfect creative partners based on your aesthetic preferences.'
          )}
        </View>
      </View>

      {/* Featured Gigs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Gigs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Gigs')}>
            <Text style={styles.sectionLink}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {featuredGigs.map(renderGigCard)}
        </ScrollView>
      </View>

      {/* Recent Showcases Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Showcases</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Showcases')}>
            <Text style={styles.sectionLink}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.showcasesGrid}>
          {recentShowcases.map(renderShowcaseCard)}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Start Creating?</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of creative professionals already using Preset. 
          Free to start, with powerful features to grow your creative business.
        </Text>
        
        <View style={styles.ctaButtons}>
          <Button
            variant="default"
            size="lg"
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.ctaButton}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            onPress={() => navigation.navigate('Gigs')}
            style={[styles.ctaButton, styles.ctaButtonOutline]}
          >
            Browse Gigs →
          </Button>
        </View>
      </View>
    </ScrollView>
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
  heroSection: {
    minHeight: 600,
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['5xl'],
  },
  heroTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.text.primary,
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    color: colors.text.secondary,
    maxWidth: width * 0.9,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroButton: {
    minWidth: 140,
  },
  featuresSection: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
  },
  sectionTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  gradientText: {
    color: colors.preset[500],
  },
  sectionSubtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    color: colors.text.secondary,
  },
  featuresGrid: {
    gap: spacing.lg,
  },
  featureCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.preset[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.h4,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  featureDescription: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionLink: {
    ...typography.body,
    color: colors.preset[500],
    fontWeight: typography.fontWeight.medium,
  },
  horizontalScroll: {
    paddingLeft: spacing.lg,
  },
  gigCard: {
    width: width * 0.8,
    marginRight: spacing.md,
  },
  gigCardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  gigImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.gray[200],
  },
  gigContent: {
    padding: spacing.md,
  },
  gigTitle: {
    ...typography.h5,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  gigDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    color: colors.text.secondary,
  },
  gigMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gigCompType: {
    ...typography.caption,
    color: colors.preset[500],
    fontWeight: typography.fontWeight.medium,
  },
  gigLocation: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  showcasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  showcaseCard: {
    width: (width - spacing.lg * 3) / 2,
  },
  showcaseCardContent: {
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
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  showcaseDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  ctaSection: {
    padding: spacing.lg,
    backgroundColor: colors.preset[500],
    alignItems: 'center',
  },
  ctaTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text.inverse,
  },
  ctaSubtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    color: colors.preset[100],
    maxWidth: width * 0.9,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaButton: {
    minWidth: 140,
  },
  ctaButtonOutline: {
    borderColor: colors.text.inverse,
  },
})
