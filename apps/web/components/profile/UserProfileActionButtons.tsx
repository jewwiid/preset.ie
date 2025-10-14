'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger} from '../ui/dropdown-menu'
import { Mail, UserPlus, Briefcase, ChevronDown } from 'lucide-react'
import { InviteToGigDialog } from '../gigs/InviteToGigDialog'

interface UserProfileActionButtonsProps {
  profileId: string // users_profile.id (database ID)
  profileUserId: string // users_profile.user_id (auth UUID) 
  profileHandle: string
  profileDisplayName: string
  profileRoleFlags?: string[] // To check if user is talent
}

export function UserProfileActionButtons({ 
  profileId,
  profileUserId, 
  profileHandle, 
  profileDisplayName,
  profileRoleFlags 
}: UserProfileActionButtonsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteToGigDialog, setShowInviteToGigDialog] = useState(false)
  
  // Check if viewing user is a talent (can only invite talents to gigs)
  const isTalent = profileRoleFlags?.includes('TALENT') || profileRoleFlags?.includes('BOTH')

  const handleContact = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    try {
      setIsLoading(true)
      // Navigate to messages page with pre-filled recipient
      router.push(`/messages?user=${profileHandle}`)
    } catch (error) {
      console.error('Error opening contact:', error)
      // Fallback: show alert or toast
      alert('Unable to open messaging. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteToProject = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    try {
      setIsLoading(true)
      // Navigate directly to create page with pre-filled invitation parameters
      // Use profileId (database ID) for the invitation, not auth user_id
      router.push(`/collaborate/create?invite=${profileId}&name=${encodeURIComponent(profileDisplayName)}`)
    } catch (error) {
      console.error('Error opening invitation:', error)
      // Fallback: show alert or toast
      alert('Unable to open invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show buttons if user is viewing their own profile
  if (user?.id === profileUserId) {
    return null
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {/* Contact Button */}
        <Button 
          size="sm" 
          variant="default"
          onClick={handleContact}
          disabled={isLoading}
        >
          <Mail className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Contact</span>
        </Button>

        {/* Invite Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Invite</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleInviteToProject}>
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Invite to Project</span>
            </DropdownMenuItem>
            {isTalent && (
              <DropdownMenuItem onClick={() => setShowInviteToGigDialog(true)}>
                <Briefcase className="h-4 w-4 mr-2" />
                <span>Invite to Gig</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Invite to Gig Dialog */}
      {isTalent && (
        <InviteToGigDialog
          open={showInviteToGigDialog}
          onOpenChange={setShowInviteToGigDialog}
          talentId={profileId}
          talentName={profileDisplayName}
        />
      )}
    </>
  )
}
