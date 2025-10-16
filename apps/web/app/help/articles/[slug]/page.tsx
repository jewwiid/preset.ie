import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  published_at: string;
  updated_at: string;
  help_categories: {
    id: string;
    name: string;
    slug: string;
    icon_name?: string;
    color_class?: string;
  };
  users_profile: {
    id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface RelatedArticle {
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
}

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getArticle(slug: string): Promise<{ article: HelpArticle; relatedArticles: RelatedArticle[] } | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/help-articles/${slug}`, {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch article');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const data = await getArticle(slug);
  
  if (!data) {
    return {
      title: 'Article Not Found',
      description: 'The requested help article could not be found.'
    };
  }

  const { article } = data;
  
  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt || 'Help article from Preset',
    keywords: article.meta_keywords,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.users_profile.display_name || `${article.users_profile.first_name} ${article.users_profile.last_name}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
    }
  };
}

function getAuthorName(profile: HelpArticle['users_profile']) {
  return profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Preset Team';
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    notFound();
  }

  const { article, relatedArticles } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/help" className="hover:text-foreground">
              Help Center
            </Link>
            <span>/</span>
            <Link 
              href={`/help/category/${article.help_categories.slug}`}
              className="hover:text-foreground"
            >
              {article.help_categories.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article>
              {/* Article Header */}
              <header className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">
                    {article.help_categories.name}
                  </Badge>
                  {article.is_featured && (
                    <Badge variant="secondary">
                      <span className="text-yellow-500">⭐</span> Featured
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {article.title}
                </h1>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>By {getAuthorName(article.users_profile)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Last updated: {format(new Date(article.updated_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {article.excerpt && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {article.excerpt}
                  </p>
                )}
              </header>

              {/* Article Content */}
              <div 
                className="prose prose-slate dark:prose-invert max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Feedback Section */}
              <div className="border-t border-border pt-8 mb-8">
                <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Back to Help Center */}
              <div className="border-t border-border pt-8">
                <Button variant="outline" asChild>
                  <Link href="/help">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Help Center
                  </Link>
                </Button>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {relatedArticles.map((relatedArticle) => (
                        <div key={relatedArticle.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                          <Link 
                            href={`/help/articles/${relatedArticle.slug}`}
                            className="block hover:text-primary transition-colors"
                          >
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {relatedArticle.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {relatedArticle.help_categories.name}
                              </Badge>
                              {relatedArticle.is_featured && (
                                <span className="text-yellow-500">⭐</span>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need More Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="mailto:support@preset.ie">
                      Contact Support
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.excerpt,
            "datePublished": article.published_at,
            "dateModified": article.updated_at,
            "author": {
              "@type": "Person",
              "name": getAuthorName(article.users_profile)
            },
            "publisher": {
              "@type": "Organization",
              "name": "Preset",
              "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://preset.ie'
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://preset.ie'}/help/articles/${article.slug}`
            }
          })
        }}
      />
    </div>
  );
}
