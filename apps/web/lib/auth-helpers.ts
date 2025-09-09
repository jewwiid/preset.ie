import { supabase } from './supabase'

export interface UserRole {
  isAdmin: boolean
  isContributor: boolean
  isTalent: boolean
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', userId)
      .single()

    if (!profile) return null

    return {
      isAdmin: profile.role_flags?.includes('ADMIN') || false,
      isContributor: profile.role_flags?.includes('CONTRIBUTOR') || false,
      isTalent: profile.role_flags?.includes('TALENT') || false
    }
  } catch (error) {
    console.error('Error fetching user role:', error)
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