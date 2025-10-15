import { supabase } from './supabase'

export interface UserRole {
  isAdmin: boolean
  isContributor: boolean
  isTalent: boolean
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    if (!supabase) {
      return null
    }
    
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', userId)
      .single()

    if (!profile) return null

    return {
      isAdmin: profile.account_type?.includes('ADMIN') || false,
      isContributor: profile.account_type?.includes('CONTRIBUTOR') || false,
      isTalent: profile.account_type?.includes('TALENT') || false
    }
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user role:', error)
    }
    return null
  }
}

export function getRedirectPath(role: UserRole | null): string {
  if (!role) return '/auth/signin'
  if (role.isAdmin) return '/admin'
  return '/dashboard'
}

export async function handleAuthRedirect(userId: string | undefined): Promise<string> {
  if (!userId) return '/auth/signin'
  
  const role = await getUserRole(userId)
  return getRedirectPath(role)
}