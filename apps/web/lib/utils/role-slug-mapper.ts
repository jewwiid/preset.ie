/**
 * Converts database role names to URL-friendly slugs
 * Example: "Photographer" -> "photographers"
 *          "Actor/Actress" -> "actors"
 *          "Voice Actor" -> "voice-actors"
 */
export function roleNameToSlug(roleName: string): string {
  return roleName
    .toLowerCase()
    .replace(/\//g, '-')           // Replace / with -
    .replace(/\s+/g, '-')          // Replace spaces with -
    .replace(/[^\w-]/g, '')        // Remove special characters
    .replace(/--+/g, '-')          // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');      // Trim - from start/end
}

/**
 * Pluralizes a role name for the slug
 * Example: "Photographer" -> "photographers"
 *          "Model" -> "models"
 */
export function pluralizeRoleSlug(slug: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'actor-actress': 'actors',
    'actress': 'actresses',
    'actor': 'actors',
    'person': 'people',
    'child': 'children',
  };

  if (specialCases[slug]) {
    return specialCases[slug];
  }

  // Handle words ending in specific patterns
  if (slug.endsWith('y')) {
    return slug.slice(0, -1) + 'ies';  // e.g., "agency" -> "agencies"
  }
  
  if (slug.endsWith('s') || slug.endsWith('sh') || slug.endsWith('ch') || slug.endsWith('x')) {
    return slug + 'es';  // e.g., "actress" -> "actresses"
  }

  // Default: just add 's'
  return slug + 's';
}

/**
 * Combines role name to final URL slug with pluralization
 */
export function getRoleSlug(roleName: string): string {
  const baseSlug = roleNameToSlug(roleName);
  return pluralizeRoleSlug(baseSlug);
}

/**
 * Creates a role card object from database role data
 */
export interface RoleCard {
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  category?: string;
  type: 'contributor' | 'talent';
}

export function createRoleCard(
  role: { name?: string; category_name?: string; description?: string; category?: string },
  getRoleImage: (slug: string) => { image_url: string; alt_text?: string } | undefined,
  type: 'contributor' | 'talent'
): RoleCard {
  const roleName = role.name || role.category_name || 'Unknown';
  const slug = getRoleSlug(roleName);
  const roleImage = getRoleImage(slug);

  return {
    name: roleName,
    slug,
    description: role.description || `Professional ${roleName.toLowerCase()}`,
    imageUrl: roleImage?.image_url,
    category: role.category,
    type
  };
}

