// Shared constants for creative industry options
// Used across preferences, profiles, and matchmaking

export const STYLE_TAGS = [
  'Portrait', 'Fashion', 'Beauty', 'Editorial', 'Commercial', 'Lifestyle',
  'Wedding', 'Event', 'Street', 'Conceptual', 'Fine Art', 'Documentary',
  'Product', 'Architecture', 'Landscape', 'Travel', 'Cinematic', 'Moody',
  'Bright', 'Minimalist', 'Vintage', 'Modern', 'Creative', 'Professional'
]

export const VIBE_TAGS = [
  'Energetic', 'Calm', 'Bold', 'Subtle', 'Dramatic', 'Natural', 'Artistic',
  'Professional', 'Casual', 'Elegant', 'Edgy', 'Romantic', 'Mysterious',
  'Playful', 'Sophisticated', 'Raw', 'Polished', 'Authentic', 'Stylized'
]

export const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Grey', 'Amber', 'Other']

export const HAIR_COLORS = ['Blonde', 'Brown', 'Black', 'Red', 'Auburn', 'Grey', 'White', 'Other']

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']

export const SPECIALIZATIONS = [
  // Photography Specializations
  'Fashion Photography', 'Portrait Photography', 'Product Photography', 'Event Photography',
  'Wedding Photography', 'Street Photography', 'Landscape Photography', 'Commercial Photography',
  'Editorial Photography', 'Fine Art Photography', 'Documentary Photography', 'Sports Photography',
  'Architectural Photography', 'Food Photography', 'Automotive Photography', 'Real Estate Photography',
  
  // Video & Cinematography
  'Cinematography', 'Video Production', 'Documentary Filmmaking', 'Commercial Video',
  'Music Video Production', 'Corporate Video', 'Social Media Video', 'Live Streaming',
  'Drone Videography', 'Motion Graphics', 'Video Editing', 'Color Grading',
  
  // Design & Visual Arts
  'Graphic Design', 'UI/UX Design', 'Brand Design', 'Logo Design', 'Print Design',
  'Web Design', 'Illustration', 'Digital Art', 'Concept Art', 'Storyboarding',
  '3D Modeling', '3D Animation', 'Visual Effects (VFX)', 'Character Design',
  
  // Audio & Music
  'Audio Production', 'Sound Design', 'Music Composition', 'Audio Engineering',
  'Podcast Production', 'Voice Over', 'Foley Artist', 'Music Mixing',
  
  // Content Creation
  'Content Strategy', 'Social Media Management', 'Copywriting', 'Creative Writing',
  'Script Writing', 'Blog Writing', 'SEO Content', 'Email Marketing',
  
  // Performance & Talent
  'Acting', 'Modeling', 'Dancing', 'Singing', 'Voice Acting', 'Presenting',
  'Public Speaking', 'Performance Art', 'Theater', 'Stand-up Comedy',
  
  // Technical & Production
  'Lighting Design', 'Set Design', 'Costume Design', 'Makeup Artistry',
  'Hair Styling', 'Production Management', 'Creative Direction', 'Art Direction'
]

export const TALENT_CATEGORIES = [
  // Performance & Entertainment
  'Model', 'Actor', 'Dancer', 'Musician', 'Singer', 'Voice Actor', 'Performer',
  'Theater Actor', 'Stand-up Comedian', 'Magician', 'Acrobat', 'Stunt Performer',
  
  // Digital & Social Media
  'Influencer', 'Content Creator', 'Social Media Manager', 'YouTuber', 'TikToker',
  'Podcaster', 'Live Streamer', 'Brand Ambassador', 'Digital Marketer',
  
  // Professional & Corporate
  'Presenter', 'Public Speaker', 'Corporate Trainer', 'Event Host', 'MC/Host',
  'Business Professional', 'Expert/Consultant', 'Industry Specialist',
  
  // Creative & Artistic
  'Artist', 'Painter', 'Sculptor', 'Digital Artist', 'Illustrator', 'Designer',
  'Creative Director', 'Art Director', 'Stylist', 'Makeup Artist', 'Hair Stylist',
  
  // Technical & Production
  'Photographer', 'Videographer', 'Camera Operator', 'Sound Engineer', 'Lighting Technician',
  'Video Editor', 'Audio Engineer', 'Production Assistant', 'Gaffer', 'Grip',
  
  // Specialized Roles
  'Hand Model', 'Fitness Model', 'Plus Size Model', 'Child Actor', 'Senior Model',
  'Character Actor', 'Body Double', 'Movement Coach', 'Dialect Coach'
]

export const EQUIPMENT_LIST = [
  // Camera Equipment
  'DSLR Camera', 'Mirrorless Camera', 'Film Camera', 'Medium Format Camera', 'Instant Camera',
  'Action Camera', 'Security Camera', '360° Camera', 'Underwater Camera',
  
  // Lenses & Optics
  'Prime Lens', 'Zoom Lens', 'Wide Angle Lens', 'Telephoto Lens', 'Macro Lens',
  'Fish Eye Lens', 'Tilt-Shift Lens', 'Anamorphic Lens', 'Cinema Lens',
  
  // Lighting Equipment
  'Professional Lighting', 'LED Panels', 'Softbox', 'Umbrella Lights', 'Ring Light',
  'Strobe Lights', 'Continuous Lights', 'Color Gels', 'Light Stands', 'Reflectors',
  'Diffusers', 'Beauty Dish', 'Barn Doors', 'Gobos', 'Practical Lights',
  
  // Support & Stabilization
  'Tripod', 'Monopod', 'Gimbal', 'Steadicam', 'Slider', 'Jib', 'Crane',
  'Dolly', 'Shoulder Rig', 'Follow Focus', 'Matte Box', 'Lens Filters',
  
  // Audio Equipment
  'Microphone', 'Boom Pole', 'Audio Recorder', 'Lavalier Mic', 'Shotgun Mic',
  'Wireless Mic System', 'Audio Interface', 'Headphones', 'Speakers', 'Mixer',
  
  // Video Equipment
  'Video Camera', 'Cinema Camera', 'Broadcast Camera', 'Webcam', 'Monitor',
  'External Recorder', 'Video Switcher', 'Capture Card', 'Video Transmitter',
  
  // Production Equipment
  'Backdrop', 'Green Screen', 'Props', 'Set Pieces', 'Costume Rack',
  'Makeup Station', 'Hair Tools', 'Wardrobe', 'Craft Services Setup',
  
  // Technology & Computing
  'Laptop', 'Desktop Computer', 'Graphics Tablet', 'Color Calibrator', 'Storage Drives',
  'Memory Cards', 'Batteries', 'Chargers', 'Cables', 'Adapters',
  
  // Drone & Aerial
  'Drone', 'FPV Drone', 'Drone Gimbal', 'Drone Batteries', 'Drone Controller',
  
  // Specialized Equipment
  'Underwater Housing', 'Weather Protection', 'Time-lapse Equipment', 'Motion Control',
  'Virtual Production Setup', 'Projection Equipment', 'Interactive Displays'
]

export const SOFTWARE_LIST = [
  // Photo Editing & Processing
  'Adobe Photoshop', 'Adobe Lightroom', 'Capture One', 'Luminar', 'Skylum Aurora',
  'Phase One Capture One', 'ON1 Photo RAW', 'Affinity Photo', 'GIMP', 'Canva',
  
  // Video Editing & Post-Production
  'Adobe Premiere Pro', 'Adobe After Effects', 'Final Cut Pro', 'DaVinci Resolve',
  'Avid Media Composer', 'Sony Vegas Pro', 'Filmora', 'iMovie', 'CapCut',
  'Adobe Audition', 'Pro Tools', 'Logic Pro', 'Ableton Live', 'Reaper',
  
  // Design & Graphics
  'Adobe Illustrator', 'Adobe InDesign', 'Figma', 'Sketch', 'Adobe XD',
  'Canva Pro', 'Affinity Designer', 'CorelDRAW', 'Procreate', 'Fresco',
  
  // 3D & Animation
  'Blender', 'Cinema 4D', 'Maya', '3ds Max', 'Houdini', 'ZBrush',
  'Substance Painter', 'Unity', 'Unreal Engine', 'Toon Boom', 'TVPaint',
  
  // Web & Digital
  'WordPress', 'Webflow', 'Squarespace', 'Shopify', 'Wix', 'Adobe Dreamweaver',
  'VS Code', 'Sublime Text', 'GitHub', 'Notion', 'Airtable',
  
  // Productivity & Project Management
  'Adobe Creative Suite', 'Microsoft Office', 'Google Workspace', 'Slack',
  'Trello', 'Asana', 'Monday.com', 'ClickUp', 'Frame.io', 'Dropbox',
  
  // Specialized Creative Software
  'Lightroom Mobile', 'VSCO', 'Snapseed', 'PicsArt', 'Photoshop Express',
  'InShot', 'LumaFusion', 'Kinemaster', 'PowerDirector', 'FilmoraGo'
]

export const LANGUAGES = [
  // Major Global Languages
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Russian', 'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  
  // European Languages
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian',
  'Romanian', 'Bulgarian', 'Croatian', 'Serbian', 'Greek', 'Turkish',
  
  // Other Significant Languages
  'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Tagalog', 'Swahili',
  'Ukrainian', 'Lithuanian', 'Latvian', 'Estonian', 'Slovenian', 'Slovak',
  
  // Sign Languages
  'ASL (American Sign Language)', 'BSL (British Sign Language)', 'International Sign',
  
  'Other'
]

// TODO: Consider making these database-driven in the future
// These could be stored in a 'platform_options' table with categories
// and updated via admin panel for dynamic option management
