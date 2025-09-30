'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  MessageCircle,
  User,
  Calendar,
  Lock
} from 'lucide-react';

interface TreatmentData {
  id: string;
  title: string;
  format: string;
  theme: string;
  sections: Array<{
    id: string;
    heading: string;
    content: string;
    images: string[];
  }>;
  loglines: Array<{
    text: string;
    type: string;
  }>;
  visibility: string;
  allow_comments: boolean;
  created_at: string;
  creator: {
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

const TREATMENT_FORMATS = {
  film_tv: { label: 'Film / TV', icon: '🎬' },
  documentary: { label: 'Documentary', icon: '📽️' },
  commercial_brand: { label: 'Commercial / Brand', icon: '📺' },
  music_video: { label: 'Music Video', icon: '🎵' },
  short_social: { label: 'Short Social', icon: '📱' },
  corporate_promo: { label: 'Corporate / Promo', icon: '🏢' }
};

const TREATMENT_THEMES = {
  cinematic: { label: 'Cinematic', description: 'Elegant serif typography, film-inspired layouts' },
  minimal: { label: 'Minimal', description: 'Clean sans-serif, lots of white space' },
  editorial: { label: 'Editorial', description: 'Magazine-style layouts, bold typography' },
  bold_art: { label: 'Bold Art', description: 'Creative layouts, artistic typography' },
  brand_deck: { label: 'Brand Deck', description: 'Corporate-friendly, professional styling' }
};

export default function SharedTreatmentPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [treatment, setTreatment] = useState<TreatmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSharedTreatment();
    }
  }, [token]);

  const fetchSharedTreatment = async () => {
    try {
      const response = await fetch(`/api/treatments/shared/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Treatment not found or no longer available');
        } else {
          setError('Failed to load treatment');
        }
        return;
      }

      const data = await response.json();
      setTreatment(data);
    } catch (err) {
      console.error('Error fetching shared treatment:', err);
      setError('Failed to load treatment');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!treatment) return;

    try {
      const response = await fetch(`/api/treatments/${treatment.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          includeImages: true,
          theme: treatment.theme
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${treatment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_treatment.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF');
    }
  };

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground-600">Loading treatment...</p>
        </div>
      </div>
    );
  }

  if (error || !treatment) {
    return (
      <div className="min-h-screen bg-muted-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Treatment Not Found</h2>
            <p className="text-muted-foreground-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted-50">
      {/* Header */}
      <div className="bg-background border-b border-border-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-muted-foreground-900">{treatment.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground-600">
                  <span>{TREATMENT_FORMATS[treatment.format as keyof typeof TREATMENT_FORMATS]?.label}</span>
                  <span>•</span>
                  <span>{TREATMENT_THEMES[treatment.theme as keyof typeof TREATMENT_THEMES]?.label}</span>
                  <span>•</span>
                  <span>Shared by {treatment.creator.display_name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {treatment.visibility === 'private' && (
                <Badge variant="secondary" className="flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              <Button variant="outline" onClick={shareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Treatment Preview */}
          <Card>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                {/* Loglines */}
                {treatment.loglines.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Loglines</h2>
                    <div className="space-y-3">
                      {treatment.loglines.map((logline, index) => (
                        <div key={index} className="p-4 bg-primary-50 rounded-lg border-l-4 border-primary-400">
                          <p className="text-muted-foreground-800">{logline.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {treatment.sections.map((section) => (
                  <div key={section.id} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
                    <div className="text-muted-foreground-700 leading-relaxed">
                      {section.content ? (
                        <div className="whitespace-pre-wrap">{section.content}</div>
                      ) : (
                        <p className="text-muted-foreground-400 italic">No content available</p>
                      )}
                    </div>
                    
                    {/* Section Images */}
                    {section.images && section.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {section.images.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${section.heading} reference ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {treatment.allow_comments && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground-300" />
                  <p>Comments feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground-500">
            <p>
              Treatment created by {treatment.creator.display_name} on{' '}
              {new Date(treatment.created_at).toLocaleDateString()}
            </p>
            <p className="mt-1">
              Powered by <span className="font-semibold text-primary-600">Preset</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
