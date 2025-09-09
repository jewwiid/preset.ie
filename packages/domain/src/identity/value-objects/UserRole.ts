/**
 * User roles in the system
 */
export enum UserRole {
  CONTRIBUTOR = 'contributor',
  TALENT = 'talent',
  ADMIN = 'admin'
}

/**
 * Permissions for each role
 */
export const RolePermissions = {
  [UserRole.CONTRIBUTOR]: [
    'create_gig',
    'manage_own_gigs',
    'review_applications',
    'book_talent',
    'create_moodboard',
    'message_applicants',
    'create_showcase',
    'leave_review'
  ],
  [UserRole.TALENT]: [
    'create_profile',
    'browse_gigs',
    'apply_to_gigs',
    'message_contributors',
    'upload_showcase_media',
    'leave_review'
  ],
  [UserRole.ADMIN]: [
    'moderate_content',
    'review_reports',
    'verify_users',
    'suspend_users',
    'access_admin_panel',
    'view_all_data'
  ]
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return RolePermissions[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): string[] {
  return RolePermissions[role] || [];
}