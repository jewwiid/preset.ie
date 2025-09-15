/**
 * Utility functions for checking user connections and messaging permissions
 */

import { supabase } from './supabase'

export interface ConnectionStatus {
  areConnected: boolean
  connectionType?: 'gig_collaboration' | 'mutual_application' | 'showcase_collaboration'
  connectionDetails?: {
    gigTitle?: string
    gigId?: string
    showcaseId?: string
  }
}

/**
 * Check if two users have worked together
 */
export async function checkUserConnection(
  currentUserId: string,
  otherUserId: string
): Promise<ConnectionStatus> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Check if they've worked together on completed gigs
    const { data: gigCollaboration, error: gigError } = await supabase
      .rpc('check_user_connection', {
        sender_user_id: currentUserId,
        recipient_user_id: otherUserId
      })

    if (gigError) {
      console.error('Error checking user connection:', gigError)
      return { areConnected: false }
    }

    if (gigCollaboration) {
      return { 
        areConnected: true, 
        connectionType: 'gig_collaboration' 
      }
    }

    // Check for mutual applications to the same gig
    const { data: mutualApplications } = await supabase
      .from('applications')
      .select(`
        gig_id,
        gigs!inner(title, status),
        applicant_user_id
      `)
      .eq('status', 'ACCEPTED')
      .eq('gigs.status', 'COMPLETED')
      .in('applicant_user_id', [currentUserId, otherUserId])

    if (mutualApplications && mutualApplications.length >= 2) {
      const gigIds = [...new Set(mutualApplications.map(app => app.gig_id))]
      const mutualGigs = gigIds.filter(gigId => 
        mutualApplications.filter(app => app.gig_id === gigId).length === 2
      )

      if (mutualGigs.length > 0) {
        return {
          areConnected: true,
          connectionType: 'mutual_application',
          connectionDetails: {
            gigId: mutualGigs[0],
            gigTitle: mutualApplications.find(app => app.gig_id === mutualGigs[0])?.gigs?.[0]?.title
          }
        }
      }
    }

    // Check for showcase collaborations
    const { data: showcases } = await supabase
      .from('showcases')
      .select('id, caption, gigs!inner(title)')
      .eq('visibility', 'PUBLIC')
      .or(`creator_user_id.eq.${currentUserId},talent_user_id.eq.${currentUserId}`)
      .or(`creator_user_id.eq.${otherUserId},talent_user_id.eq.${otherUserId}`)

    if (showcases && showcases.length > 0) {
      return {
        areConnected: true,
        connectionType: 'showcase_collaboration',
        connectionDetails: {
          showcaseId: showcases[0].id
        }
      }
    }

    return { areConnected: false }
  } catch (error) {
    console.error('Error checking user connection:', error)
    return { areConnected: false }
  }
}

/**
 * Check if current user can message another user
 */
export async function canMessageUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ canMessage: boolean; reason?: string }> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Get target user's messaging settings
    const { data: targetSettings } = await supabase
      .from('user_settings')
      .select('allow_stranger_messages')
      .eq('profile_id', targetUserId)
      .single()

    // If no settings found, default to allowing strangers
    if (!targetSettings) {
      return { canMessage: true }
    }

    // If target allows stranger messages, allow it
    if (targetSettings.allow_stranger_messages) {
      return { canMessage: true }
    }

    // Check if they have a connection
    const connectionStatus = await checkUserConnection(currentUserId, targetUserId)
    
    if (connectionStatus.areConnected) {
      return { canMessage: true }
    }

    return { 
      canMessage: false, 
      reason: 'This user only accepts messages from people they\'ve worked with' 
    }
  } catch (error) {
    console.error('Error checking message permission:', error)
    return { canMessage: false, reason: 'Unable to verify messaging permissions' }
  }
}

/**
 * Get connection status for display in UI
 */
export function getConnectionStatusText(status: ConnectionStatus): string {
  if (!status.areConnected) {
    return 'No previous collaboration'
  }

  switch (status.connectionType) {
    case 'gig_collaboration':
      return 'Previous gig collaboration'
    case 'mutual_application':
      return `Worked together on: ${status.connectionDetails?.gigTitle || 'Unknown gig'}`
    case 'showcase_collaboration':
      return 'Showcase collaboration'
    default:
      return 'Previous collaboration'
  }
}
