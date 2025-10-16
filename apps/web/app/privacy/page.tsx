'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Lock, Database, UserCheck, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Preset ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website preset.ie and use our services.
          </p>
          <p className="text-muted-foreground">
            By using Preset, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  When you create an account, we collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Name, email address, and other contact information</li>
                  <li>Profile information including photos, bio, and creative preferences</li>
                  <li>Location information for gig matching</li>
                  <li>Professional details such as experience and equipment</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Usage Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  We automatically collect information about how you use our services:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Pages visited and time spent on each page</li>
                  <li>Features used and actions taken within the platform</li>
                  <li>Device information including browser type and operating system</li>
                  <li>IP address and general location information</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Content Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  Information you provide when using our services:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Gig postings and requirements</li>
                  <li>Applications and communications</li>
                  <li>Showcases and portfolio content</li>
                  <li>Reviews and ratings</li>
                  <li>Messages and other communications</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Provision</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>To create and manage your account</li>
                  <li>To facilitate connections between creatives</li>
                  <li>To process gig applications and bookings</li>
                  <li>To provide customer support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personalization</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>To personalize your experience</li>
                  <li>To provide relevant gig recommendations</li>
                  <li>To tailor content to your preferences</li>
                  <li>To remember your settings and preferences</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>To send you transactional emails</li>
                  <li>To respond to your inquiries</li>
                  <li>To send you updates about your account</li>
                  <li>To provide customer support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics & Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>To analyze usage patterns</li>
                  <li>To improve our services</li>
                  <li>To develop new features</li>
                  <li>To ensure platform security</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Within Preset</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  We may share your information within Preset:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Between users for gig applications and collaborations</li>
                  <li>With customer support representatives to assist you</li>
                  <li>Between team members to provide services</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  We may share information with third-party service providers:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Payment processors for subscription management</li>
                  <li>Analytics providers to understand usage patterns</li>
                  <li>Hosting providers to maintain our services</li>
                  <li>Email service providers for communications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legal Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  We may disclose your information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>When required by law or legal process</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>To prevent fraud or illegal activity</li>
                  <li>To cooperate with law enforcement investigations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Security */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Protecting Your Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Secure servers with encryption at rest and in transit</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Employee training on privacy and security</li>
                <li>Data minimization and retention policies</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                However, no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access and Correction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You have the right to access and correct your personal information. You can update your profile information at any time through your account settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Portability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can request a copy of your personal information in a structured, commonly used format.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deletion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can request deletion of your account and personal information, subject to certain legal obligations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Restriction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can request restriction of processing of your personal information under certain circumstances.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Tracking</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cookie Consent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how our site is used</li>
                <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control your cookie preferences through our cookie consent banner. You can change your preferences at any time by clicking the "Manage preferences" link in the footer.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                Preset is not intended for use by children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information immediately.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Changes to This Policy */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a prominent notice on our platform</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We encourage you to review this policy periodically to stay informed about how we are protecting your information.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> <a href="mailto:privacy@preset.ie" className="text-primary hover:underline">privacy@preset.ie</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Address:</strong> Preset, Creative Collaboration Platform
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
