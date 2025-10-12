'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

interface CallToActionSectionProps {
  isLoggedIn: boolean
}

export default function CallToActionSection({ isLoggedIn }: CallToActionSectionProps) {
  const router = useRouter()

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Ready to Start Creating?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join thousands of creative professionals already using Preset. Free to start, with powerful features to grow your creative business.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/signup')}
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg font-semibold transition-all duration-200 group"
            onClick={() => router.push('/gigs')}
          >
            Browse Gigs
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
