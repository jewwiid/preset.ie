import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Calendar, User, Star } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  color_class?: string;
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

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCategoryData(slug: string): Promise<{ category: HelpCategory; articles: HelpArticle[] } | null> {
  try {
    // First, get the category info
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/help-categories`, {
      cache: 'no-store'
    });

    if (!categoriesResponse.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categoriesData = await categoriesResponse.json();
    const category = categoriesData.categories?.find((cat: HelpCategory) => cat.slug === slug);

    if (!category) {
      return null;
    }

    // Then get articles for this category
    const articlesResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/help-articles?category=${slug}`, {
      cache: 'no-store'
    });

    if (!articlesResponse.ok) {
      throw new Error('Failed to fetch articles');
    }

    const articlesData = await articlesResponse.json();

    return {
      category,
      articles: articlesData.articles || []
    };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await getCategoryData(slug);
  
  if (!data) {
    return {
      title: 'Category Not Found',
      description: 'The requested help category could not be found.'
    };
  }

  const { category } = data;
  
  return {
    title: `${category.name} - Help Center`,
    description: category.description || `Help articles about ${category.name}`,
  };
}

function getAuthorName(profile: HelpArticle['users_profile']) {
  return profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Preset Team';
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await getCategoryData(slug);

  if (!data) {
    notFound();
  }

  const { category, articles } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/help" className="hover:text-foreground">
              Help Center
            </Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Help Center
              </Link>
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {category.name}
          </h1>
          
          {category.description && (
            <p className="text-lg text-muted-foreground mb-6">
              {category.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{articles.length} articles</span>
            <span>•</span>
            <span>Last updated: {format(new Date(), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles in this category..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No articles found in this category yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {article.is_featured && (
                          <Badge variant="secondary">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {article.help_categories.name}
                        </Badge>
                      </div>
                      
                      <Link 
                        href={`/help/articles/${article.slug}`}
                        className="block group"
                      >
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h2>
                      </Link>
                      
                      {article.excerpt && (
                        <p className="text-muted-foreground mb-4">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{getAuthorName(article.users_profile)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(article.published_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/help/articles/${article.slug}`}>
                        Read Article
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Help Center */}
        <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link href="/help">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
