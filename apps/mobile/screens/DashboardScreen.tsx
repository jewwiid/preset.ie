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
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../styles/colors'
import { typography } from '../styles/typography'
import { spacing, borderRadius, shadows } from '../styles/spacing'
import { Button, Card, Badge } from '../components/ui'
import { databaseService } from '../lib/database-service'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { UserProfile, Gig, UserCredits } from '../lib/database-types'

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>

const { width } = Dimensions.get('window')

// Use proper database types
type RecentGig = Pick<Gig, 'id' | 'title' | 'description' | 'comp_type' | 'location_text' | 'created_at' | 'status'>

interface BannerPosition {
  y: number
  scale: number
}

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentGigs, setRecentGigs] = useState<RecentGig[]>([])
  const [stats, setStats] = useState({
    totalGigs: 0,
    totalApplications: 0,
    totalShowcases: 0,
    totalMessages: 0
  })
  const [credits, setCredits] = useState<Pick<UserCredits, 'current_balance' | 'monthly_allowance' | 'consumed_this_month'>>({
    current_balance: 0,
    monthly_allowance: 0,
    consumed_this_month: 0
  })
  const [isRecentGigsExpanded, setIsRecentGigsExpanded] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigation.navigate('SignIn')
        return
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        if (profileError.code === 'PGRST116') {
          // No profile found, redirect to create profile
          Alert.alert('Profile Required', 'Please complete your profile setup first.')
          return
        }
      } else {
        setProfile(profileData)
        await loadUserData(user.id, profileData)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId: string, profileData: UserProfile) => {
    try {
      const isContributor = profileData.role_flags?.includes('CONTRIBUTOR') || profileData.role_flags?.includes('BOTH')
      const isTalent = profileData.role_flags?.includes('TALENT') || profileData.role_flags?.includes('BOTH')

      // Load recent gigs
      let gigsQuery = supabase
        .from('gigs')
        .select('id, title, description, comp_type, location_text, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3)

      if (isContributor) {
        gigsQuery = gigsQuery.eq('owner_user_id', userId)
      } else {
        gigsQuery = gigsQuery.eq('status', 'PUBLISHED')
      }

      const { data: gigs } = await gigsQuery
      setRecentGigs(gigs || [])

      // Load statistics
      const statsPromises = []

      if (isContributor) {
        statsPromises.push(
          supabase
            .from('gigs')
            .select('id', { count: 'exact' })
            .eq('owner_user_id', userId)
        )
      } else {
        statsPromises.push(Promise.resolve({ count: 0 }))
      }

      if (isTalent) {
        statsPromises.push(
          supabase
            .from('applications')
            .select('id', { count: 'exact' })
            .eq('applicant_user_id', userId)
        )
      } else {
        statsPromises.push(Promise.resolve({ count: 0 }))
      }

      statsPromises.push(
        supabase
          .from('showcases')
          .select('id', { count: 'exact' })
          .or(`creator_user_id.eq.${userId},talent_user_id.eq.${userId}`)
      )

      statsPromises.push(
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      )

      // Load credits
      const creditsQuery = supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance, consumed_this_month')
        .eq('user_id', userId)
        .maybeSingle()

      const [gigsCount, applicationsCount, showcasesCount, messagesCount, userCredits] = await Promise.all([
        ...statsPromises,
        creditsQuery
      ])

      setStats({
        totalGigs: gigsCount.count || 0,
        totalApplications: applicationsCount.count || 0,
        totalShowcases: showcasesCount.count || 0,
        totalMessages: messagesCount.count || 0
      })

      if ('data' in userCredits && userCredits.data && !Array.isArray(userCredits.data)) {
        setCredits({
          current_balance: userCredits.data.current_balance || 0,
          monthly_allowance: userCredits.data.monthly_allowance || 0,
          consumed_this_month: userCredits.data.consumed_this_month || 0
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const calculateCreditValue = (credits: number) => credits * 0.01

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigation.navigate('SignIn')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
        <Button onPress={loadDashboardData}>Retry</Button>
      </View>
    )
  }

  const isContributor = profile.role_flags?.includes('CONTRIBUTOR') || profile.role_flags?.includes('BOTH')
  const isTalent = profile.role_flags?.includes('TALENT') || profile.role_flags?.includes('BOTH')
  const isAdmin = profile.role_flags?.includes('ADMIN')

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        {/* Custom Banner Background */}
        {profile.header_banner_url ? (
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: profile.header_banner_url }}
              style={[
                styles.bannerImage,
                (() => {
                  try {
                    const position: BannerPosition = profile.header_banner_position 
                      ? JSON.parse(profile.header_banner_position) 
                      : { y: 0, scale: 1.2 }
                    return {
                      transform: [{ translateY: position.y }, { scale: position.scale }],
                    }
                  } catch {
                    return {}
                  }
                })()
              ]}
            />
            <View style={styles.bannerOverlay} />
          </View>
        ) : (
          <View style={styles.defaultBanner} />
        )}
        
        <View style={styles.headerContent}>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <Text style={styles.actionButtonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
              <Text style={styles.actionButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.welcomeText}>
            Welcome back, {isAdmin ? 'Admin' : profile.display_name}!
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Profile & Recent Gigs */}
        <View style={styles.profileSection}>
          {/* Profile Card */}
          <Card style={styles.profileCard} variant="elevated">
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {profile.avatar_url ? (
                  <Image 
                    source={{ uri: profile.avatar_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>{profile.display_name}</Text>
                  <Badge variant="default" size="sm">
                    {profile.subscription_tier}
                  </Badge>
                </View>
                <View style={styles.handleRow}>
                  <Text style={styles.handle}>@{profile.handle}</Text>
                  <View style={styles.roleIndicator}>
                    <View style={styles.roleDot} />
                    <Text style={styles.roleText}>
                      {isContributor && isTalent ? 'Contributor & Talent' : 
                       isContributor ? 'Contributor' : 'Talent'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Credits & Balance */}
            <View style={styles.creditsRow}>
              <TouchableOpacity style={styles.creditCard}>
                <View style={styles.creditIcon}>
                  <Ionicons name="wallet-outline" size={24} color={colors.text.inverse} />
                </View>
                <View style={styles.creditInfo}>
                  <Text style={styles.creditLabel}>Available Credits</Text>
                  <Text style={styles.creditValue}>
                    {credits.current_balance} of {credits.monthly_allowance || 'unlimited'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.creditCard}>
                <View style={[styles.creditIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="cash-outline" size={24} color={colors.text.inverse} />
                </View>
                <View style={styles.creditInfo}>
                  <Text style={styles.creditLabel}>Account Balance</Text>
                  <Text style={styles.creditValue}>
                    €{calculateCreditValue(credits.current_balance).toFixed(2)} EUR
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Location */}
            {profile.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.locationText}>{profile.city}</Text>
              </View>
            )}
          </Card>

          {/* Recent Gigs Card */}
          <Card style={styles.gigsCard} variant="elevated">
            <View style={styles.gigsHeader}>
              <View style={styles.gigsTitleRow}>
                <View style={styles.gigsIcon}>
                  <Ionicons name="time-outline" size={20} color={colors.text.inverse} />
                </View>
                <Text style={styles.gigsTitle}>
                  {isContributor ? 'My Recent Gigs' : 'Recent Gigs'}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => setIsRecentGigsExpanded(!isRecentGigsExpanded)}
                style={styles.expandButton}
              >
                <Ionicons 
                  name={isRecentGigsExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.text.secondary} 
                />
              </TouchableOpacity>
            </View>
            
            {isRecentGigsExpanded && (
              <View style={styles.gigsList}>
                {recentGigs.length > 0 ? (
                  recentGigs.map((gig) => (
                    <TouchableOpacity key={gig.id} style={styles.gigItem}>
                      <Text style={styles.gigItemTitle}>{gig.title}</Text>
                      <Text style={styles.gigItemDescription} numberOfLines={2}>{gig.description}</Text>
                      <View style={styles.gigItemMeta}>
                        <Text style={styles.gigItemCompType}>{gig.comp_type}</Text>
                        <Text style={styles.gigItemLocation}>{gig.location_text}</Text>
                      </View>
                      <View style={styles.gigItemFooter}>
                        <Text style={styles.gigItemDate}>
                          {new Date(gig.created_at).toLocaleDateString()}
                        </Text>
                        <Badge 
                          variant={gig.status === 'PUBLISHED' ? 'success' : 'secondary'} 
                          size="sm"
                        >
                          {gig.status}
                        </Badge>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyGigs}>
                    <Text style={styles.emptyGigsText}>
                      {isContributor ? 'No gigs created yet' : 'No recent gigs available'}
                    </Text>
                  </View>
                )}
                
                {recentGigs.length > 0 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('Gigs')}
                  >
                    <Text style={styles.viewAllButtonText}>
                      {isContributor ? 'View All My Gigs' : 'Browse All Gigs'} →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Gigs')}
          >
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Gigs</Text>
              <Text style={styles.statValue}>{stats.totalGigs}</Text>
            </View>
            <View style={styles.statIcon}>
              <Ionicons name="briefcase-outline" size={24} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Applications')}
          >
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Applications</Text>
              <Text style={styles.statValue}>{stats.totalApplications}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.info }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Showcases')}
          >
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Showcases</Text>
              <Text style={styles.statValue}>{stats.totalShowcases}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="images-outline" size={24} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Messages')}
          >
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Messages</Text>
              <Text style={styles.statValue}>{stats.totalMessages}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          {/* Contributor Actions */}
          {isContributor && (
            <Card style={styles.actionCard} variant="elevated">
              <View style={styles.actionCardHeader}>
                <View style={styles.actionCardIcon}>
                  <Ionicons name="time-outline" size={20} color={colors.text.inverse} />
                </View>
                <Text style={styles.actionCardTitle}>Contributor Actions</Text>
              </View>
              <View style={styles.actionCardContent}>
                <Button
                  variant="default"
                  size="lg"
                  onPress={() => navigation.navigate('CreateGig')}
                  style={styles.actionButtonPrimary}
                >
                  Create New Gig
                </Button>
                <View style={styles.actionButtonRow}>
                  <Button
                    variant="outline"
                    onPress={() => navigation.navigate('Gigs')}
                    style={styles.actionButtonSecondary}
                  >
                    My Gigs
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => navigation.navigate('Applications')}
                    style={styles.actionButtonSecondary}
                  >
                    Applications
                  </Button>
                </View>
              </View>
            </Card>
          )}

          {/* Talent Actions */}
          {isTalent && (
            <Card style={styles.actionCard} variant="elevated">
              <View style={styles.actionCardHeader}>
                <View style={[styles.actionCardIcon, { backgroundColor: colors.info }]}>
                  <Ionicons name="flash-outline" size={20} color={colors.text.inverse} />
                </View>
                <Text style={styles.actionCardTitle}>Talent Actions</Text>
              </View>
              <View style={styles.actionCardContent}>
                <Button
                  variant="default"
                  size="lg"
                  onPress={() => navigation.navigate('Gigs')}
                  style={[styles.actionButtonPrimary, { backgroundColor: colors.info }]}
                >
                  Browse Gigs
                </Button>
                <View style={styles.actionButtonRow}>
                  <Button
                    variant="outline"
                    onPress={() => navigation.navigate('Applications')}
                    style={styles.actionButtonSecondary}
                  >
                    My Applications
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => navigation.navigate('Showcases')}
                    style={styles.actionButtonSecondary}
                  >
                    Showcases
                  </Button>
                </View>
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  heroHeader: {
    height: 200,
    position: 'relative',
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  defaultBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.preset[500],
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.medium,
  },
  welcomeText: {
    ...typography.h2,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  mainContent: {
    marginTop: -spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  profileSection: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileCard: {
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.preset[200],
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.preset[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.preset[200],
  },
  avatarText: {
    ...typography.h3,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  displayName: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  handle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  roleText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  creditsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  creditCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditInfo: {
    flex: 1,
  },
  creditLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  creditValue: {
    ...typography.h6,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  gigsCard: {
    padding: spacing.lg,
  },
  gigsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gigsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gigsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gigsTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  expandButton: {
    padding: spacing.xs,
  },
  gigsList: {
    gap: spacing.md,
  },
  gigItem: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  gigItemTitle: {
    ...typography.h6,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  gigItemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  gigItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gigItemCompType: {
    ...typography.caption,
    color: colors.preset[500],
    fontWeight: typography.fontWeight.medium,
  },
  gigItemLocation: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  gigItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gigItemDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  emptyGigs: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyGigsText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  viewAllButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  viewAllButtonText: {
    ...typography.body,
    color: colors.preset[500],
    fontWeight: typography.fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: (width - spacing.lg * 3) / 2,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.preset[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCards: {
    gap: spacing.lg,
  },
  actionCard: {
    padding: spacing.lg,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.preset[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  actionCardContent: {
    gap: spacing.md,
  },
  actionButtonPrimary: {
    backgroundColor: colors.preset[500],
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButtonSecondary: {
    flex: 1,
  },
})
