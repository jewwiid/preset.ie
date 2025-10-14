'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ticket, ArrowRight } from 'lucide-react'
import { Logo } from '../../../components/Logo'

export default function InviteRequiredPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo className="w-16 h-16" size={64} />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Invite Required
          </h1>
          <p className="mt-4 text-muted-foreground">
            Preset is currently in invite-only mode. You need an invite code to create an account.
          </p>
        </div>

        {/* Information */}
        <div className="space-y-4 mb-8">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">How to get an invite:</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Ask a friend who&apos;s already on Preset for their invite code</li>
              <li>• Each user gets their own unique invite code to share</li>
              <li>• Look out for invite codes in our newsletters and social media</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors duration-200"
          >
            I have an invite code
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-lg text-foreground hover:bg-accent transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

