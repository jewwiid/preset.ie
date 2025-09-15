'use client'

import React from 'react'
import CompatibilityScore from '../components/matchmaking/CompatibilityScore'
import MatchmakingCard from '../components/matchmaking/MatchmakingCard'
import CompatibilityBreakdownModal from '../components/matchmaking/CompatibilityBreakdownModal'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

const TestMatchmakingPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false)

  // Mock data for testing
  const mockBreakdown = {
    gender: 20,
    age: 20,
    height: 15,
    experience: 25,
    specialization: 20,
    total: 100
  }

  const mockGig = {
    id: '1',
    title: 'Fashion Photography Shoot',
    description: 'Looking for a talented photographer for a fashion editorial shoot in downtown studio.',
    location_text: 'New York, NY',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T16:00:00Z',
    comp_type: 'PAID',
    owner_user_id: 'owner-1',
    status: 'PUBLISHED',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockUser = {
    id: '1',
    user_id: 'user-1',
    display_name: 'John Doe',
    handle: 'johndoe',
    bio: 'Professional photographer with 5+ years of experience in fashion and portrait photography.',
    city: 'New York',
    country: 'USA',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    specializations: ['Fashion Photography', 'Portrait Photography', 'Studio Photography'],
    years_experience: 5,
    hourly_rate_min: 100,
    hourly_rate_max: 200,
    available_for_travel: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockCompatibilityData = {
    score: 95,
    breakdown: mockBreakdown,
    factors: {
      gender_match: true,
      age_match: true,
      height_match: true,
      experience_match: true,
      specialization_match: 3
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Matchmaking Components Test</h1>
          <p className="text-gray-600">Testing the matchmaking UI components</p>
        </div>

        {/* Compatibility Score Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibility Score Component</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">Small Size</h3>
                <CompatibilityScore
                  score={95}
                  breakdown={mockBreakdown}
                  size="sm"
                  showBreakdown={true}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Medium Size</h3>
                <CompatibilityScore
                  score={75}
                  breakdown={mockBreakdown}
                  size="md"
                  showBreakdown={true}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Large Size</h3>
                <CompatibilityScore
                  score={45}
                  breakdown={mockBreakdown}
                  size="lg"
                  showBreakdown={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matchmaking Card Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Matchmaking Card Component</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">Gig Card</h3>
                <MatchmakingCard
                  type="gig"
                  data={mockGig}
                  compatibilityScore={95}
                  compatibilityBreakdown={mockBreakdown}
                  onViewDetails={() => console.log('View gig details')}
                  onApply={() => console.log('Apply to gig')}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">User Card</h3>
                <MatchmakingCard
                  type="user"
                  data={mockUser}
                  compatibilityScore={88}
                  compatibilityBreakdown={mockBreakdown}
                  onViewDetails={() => console.log('View user profile')}
                  onApply={() => console.log('Contact user')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compatibility Breakdown Modal Test */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibility Breakdown Modal</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowModal(true)}>
              Open Compatibility Breakdown Modal
            </Button>
          </CardContent>
        </Card>

        {/* Modal */}
        <CompatibilityBreakdownModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userProfile={mockUser}
          gig={mockGig}
          compatibilityData={mockCompatibilityData}
        />
      </div>
    </div>
  )
}

export default TestMatchmakingPage
