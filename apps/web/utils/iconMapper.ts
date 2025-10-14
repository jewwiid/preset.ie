// Helper function to convert icon names to emojis
export const getIconEmoji = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    // People & Relationships
    'heart': '❤️',
    'user': '👤',
    'users': '👥',
    'baby': '👶',
    'ring': '💍',
    'graduation-cap': '🎓',
    'user-check': '✅',

    // Places & Objects
    'home': '🏠',
    'package': '📦',
    'shirt': '👕',
    'map-pin': '📍',
    'mountain': '🏔️',
    'tree-pine': '🌲',
    'building': '🏢',

    // Activities & Sports
    'trophy': '🏆',
    'calendar': '📅',
    'dog': '🐕',
    'utensils': '🍴',
    'map': '🗺️',

    // Nature & Travel
    'search': '🔍',
    'moon': '🌙',
    'waves': '🌊',
    'plane': '✈️',

    // Work & Business
    'video': '🎥',
    'briefcase': '💼',
    'laptop': '💻',
    'film': '🎬',
    'camera': '📷',
    'music': '🎵',
    'palette': '🎨',
    'pen-tool': '✏️',

    // Equipment
    'lens': '🔍',
    'lighting': '💡',
    'audio': '🎤',
    'tripod': '📐',
    'accessories': '🔧',
    'camera_body': '📷',
    'computing': '💻',
    'studio': '🎬',
    'transportation': '🚗',

    // Default
    'other': '📦',
    'default': '📦'
  };

  return iconMap[iconName] || iconMap['default'];
};
