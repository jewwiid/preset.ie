'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  BookOpen, 
  Users, 
  Shield, 
  MessageCircle, 
  Camera, 
  Star, 
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Zap,
  FileText,
  Settings,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Mail,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  color_class?: string;
  display_order: number;
  is_active: boolean;
  article_count: number;
}

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  is_featured: boolean;
  published_at: string;
  help_categories: {
    id: string;
    name: string;
    slug: string;
  };
  users_profile: {
    id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

// Icon mapping for categories
const iconMap: Record<string, any> = {
  'BookOpen': BookOpen,
  'Camera': Camera,
  'Users': Users,
  'Star': Star,
  'Shield': Shield,
  'Settings': Settings,
  'FileText': FileText,
  'HelpCircle': HelpCircle
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<HelpArticle[]>([])
  const [loading, setLoading] = useState(true)

  // Load categories and featured articles
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load categories
        const categoriesResponse = await fetch('/api/admin/help-categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }

        // Load featured articles
        const articlesResponse = await fetch('/api/help-articles?featured=true&limit=6')
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          setFeaturedArticles(articlesData.articles || [])
        }
      } catch (error) {
        console.error('Error loading help data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Transform categories for display
  const helpCategories = categories.map(category => {
    const IconComponent = iconMap[category.icon_name || 'FileText'] || FileText
    const colorClass = category.color_class || 'bg-muted text-muted-foreground'
    
    return {
      id: category.id,
      title: category.name,
      description: category.description || 'Help articles in this category',
      icon: IconComponent,
      color: colorClass,
      slug: category.slug,
      articleCount: category.article_count
    }
  })

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: Mail,
      href: 'mailto:support@preset.ie',
          color: 'bg-primary/10 text-primary'
    },
    {
      title: 'Report an Issue',
      description: 'Report a safety or technical issue',
      icon: AlertTriangle,
      href: '#',
          color: 'bg-destructive/10 text-destructive'
    },
    {
      title: 'Feature Requests',
      description: 'Suggest new features or improvements',
      icon: Zap,
      href: '#',
          color: 'bg-secondary/50 text-secondary-foreground'
    }
  ]

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <div className="bg-card border-b border-border py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Find answers to your questions and learn how to make the most of Preset
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Help Categories */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-muted-foreground">
                        {category.articleCount} articles
                      </span>
                      <Link 
                        href={`/help/category/${category.slug}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View all
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${action.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{action.description}</p>
                    <Button asChild className="w-full">
                      <Link href={action.href}>
                        Get Help
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Featured Articles */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Articles</h2>
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                      <div className="h-8 bg-muted rounded w-24 mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.slice(0, 4).map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                      <Badge variant="outline">
                        {article.help_categories.name}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {article.excerpt || 'Read this article to learn more about this topic.'}
                    </p>
                    <Button variant="outline" asChild>
                      <Link href={`/help/articles/${article.slug}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I upgrade my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can upgrade your subscription at any time by visiting the pricing page or your account settings. 
                  Changes take effect immediately and you'll be charged the prorated difference.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/subscription">View Pricing</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I report inappropriate content?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use the report button on any content or message to report it to our moderation team. 
                  We review all reports within 24 hours and take appropriate action.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="#">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are AI credits and how do they work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI credits are used for image enhancement and other AI features. 1 credit equals 1 enhancement operation. 
                  You can purchase credit packages in your account settings.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="#">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

            {/* Contact Support */}
            <section className="text-center">
              <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our support team is here to help. Reach out to us and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="mailto:support@preset.ie">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Live Chat
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
