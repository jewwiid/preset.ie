import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Role to skill mapping function
function getRoleSkillMapping(role: string): string[] {
  const roleMappings: Record<string, string[]> = {
    // Creative Roles
    'Photographer': ['Photography', 'Lighting', 'Photo Editing', 'Lightroom', 'Photoshop', 'Adobe Creative Suite'],
    'Videographer': ['Videography', 'Cinematography', 'Video Editing', 'Premiere Pro', 'Final Cut Pro', 'After Effects'],
    'Director': ['Directing', 'Communication', 'Leadership', 'Project Management', 'Team Collaboration'],
    'Cinematographer': ['Cinematography', 'Lighting', 'Camera Operation', 'Visual Storytelling', 'DaVinci Resolve'],
    'Model': ['Modeling', 'Acting', 'Posing', 'Communication', 'Professionalism'],
    'Actor/Actress': ['Acting', 'Modeling', 'Communication', 'Performance', 'Script Reading'],
    'Makeup Artist': ['Makeup Artistry', 'Hair Styling', 'Beauty Styling', 'Color Theory', 'Product Knowledge'],
    'Hair Stylist': ['Hair Styling', 'Makeup Artistry', 'Beauty Styling', 'Color Theory', 'Product Knowledge'],
    'Wardrobe Stylist': ['Fashion Styling', 'Styling', 'Color Theory', 'Fashion Trends', 'Wardrobe Management'],
    'Fashion Stylist': ['Fashion Styling', 'Styling', 'Color Theory', 'Fashion Trends', 'Wardrobe Management'],
    
    // Technical Roles
    'Lighting Technician': ['Lighting', 'Equipment Operation', 'Electrical Safety', 'Lighting Design', 'Grip Work'],
    'Sound Engineer': ['Sound Recording', 'Audio Engineering', 'Audio Post-Production', 'Pro Tools', 'Equipment Operation'],
    'Audio Technician': ['Sound Recording', 'Audio Engineering', 'Equipment Operation', 'Microphone Techniques'],
    'Gaffer': ['Lighting', 'Equipment Operation', 'Electrical Safety', 'Lighting Design', 'Team Management'],
    'Grip': ['Equipment Operation', 'Camera Support', 'Rigging', 'Safety Management', 'Physical Work'],
    'Drone Operator': ['Drone Operation', 'Aerial Photography', 'Safety Management', 'Equipment Operation', 'Regulations'],
    
    // Production Roles
    'Producer': ['Project Management', 'Communication', 'Leadership', 'Budget Management', 'Team Collaboration'],
    'Production Assistant': ['Communication', 'Time Management', 'Problem Solving', 'Team Collaboration', 'Organization'],
    'Assistant': ['Communication', 'Time Management', 'Problem Solving', 'Team Collaboration', 'Organization'],
    'Location Scout': ['Location Scouting', 'Communication', 'Research', 'Negotiation', 'Logistics'],
    'Script Supervisor': ['Communication', 'Attention to Detail', 'Organization', 'Continuity Management'],
    
    // Post-Production Roles
    'Editor': ['Video Editing', 'Photo Editing', 'Premiere Pro', 'Final Cut Pro', 'After Effects', 'DaVinci Resolve'],
    'Color Grader': ['Color Grading', 'DaVinci Resolve', 'Color Theory', 'Visual Storytelling', 'Technical Skills'],
    'Motion Graphics Designer': ['Motion Graphics', 'After Effects', 'Animation', 'Visual Effects', 'Adobe Creative Suite'],
    'Visual Effects Artist': ['Visual Effects', 'After Effects', 'Motion Graphics', 'Compositing', '3D Software'],
    
    // Design Roles
    'Art Director': ['Set Design', 'Visual Design', 'Creative Direction', 'Team Management', 'Project Management'],
    'Set Designer': ['Set Design', 'Props Design', 'Spatial Design', 'Creative Problem Solving', 'Construction'],
    'Props Master': ['Props Design', 'Set Design', 'Research', 'Organization', 'Logistics'],
    'Costume Designer': ['Costume Design', 'Fashion Design', 'Historical Research', 'Fabric Knowledge', 'Sewing'],
    'Storyboard Artist': ['Drawing', 'Visual Storytelling', 'Communication', 'Animation', 'Concept Art'],
    
    // Marketing Roles
    'Social Media Manager': ['Social Media Management', 'Content Creation', 'Digital Marketing', 'Analytics', 'Communication'],
    'Content Creator': ['Content Creation', 'Social Media Management', 'Digital Marketing', 'Creative Writing', 'Photography'],
    'Brand Manager': ['Brand Management', 'Marketing Strategy', 'Communication', 'Project Management', 'Analytics'],
    'Marketing Coordinator': ['Digital Marketing', 'Project Management', 'Communication', 'Analytics', 'Content Creation'],
    
    // Writing Roles
    'Writer': ['Creative Writing', 'Script Writing', 'Communication', 'Research', 'Storytelling'],
    'Copywriter': ['Copywriting', 'Creative Writing', 'Marketing', 'Communication', 'Brand Voice'],
    'Script Writer': ['Script Writing', 'Creative Writing', 'Storytelling', 'Character Development', 'Dialogue'],
    
    // Specialized Roles
    'Event Coordinator': ['Event Planning', 'Project Management', 'Communication', 'Logistics', 'Organization'],
    'Equipment Manager': ['Equipment Maintenance', 'Inventory Management', 'Technical Knowledge', 'Organization', 'Safety'],
    'Safety Coordinator': ['Safety Management', 'Risk Assessment', 'Regulations', 'Communication', 'Emergency Procedures'],
    'Transportation Coordinator': ['Transportation Logistics', 'Project Management', 'Communication', 'Scheduling', 'Organization']
  };

  return roleMappings[role] || [];
}

// GET /api/collab/predefined/skills
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const role = searchParams.get('role');

    let query = supabase
      .from('predefined_skills')
      .select('id, name, category, description, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    // If role is specified, filter skills based on role-to-skill mapping
    if (role) {
      const roleSkillMapping = getRoleSkillMapping(role);
      if (roleSkillMapping.length > 0) {
        query = query.in('name', roleSkillMapping);
      }
    }

    const { data: skills, error } = await query;

    if (error) {
      console.error('Error fetching predefined skills:', error);
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      );
    }

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error in skills API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
