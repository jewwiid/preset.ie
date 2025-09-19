import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { getUserFromRequest } from '../../../../../lib/auth-utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { format = 'pdf', theme = 'cinematic' } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Get treatment data
    const { data: treatment, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    // For now, return a simple HTML version
    // In production, you'd use Puppeteer to generate PDF
    const html = generateTreatmentHTML(treatment, theme);

    return NextResponse.json({
      html,
      downloadUrl: `/api/treatments/${id}/download?format=${format}&theme=${theme}`,
      message: 'Export generated successfully'
    });

  } catch (error) {
    console.error('Error exporting treatment:', error);
    return NextResponse.json({ error: 'Failed to export treatment' }, { status: 500 });
  }
}

function generateTreatmentHTML(treatment: any, theme: string) {
  const content = treatment.json_content;
  const formatLabels = {
    film_tv: 'Film / TV',
    documentary: 'Documentary',
    commercial_brand: 'Commercial / Brand',
    music_video: 'Music Video',
    short_social: 'Short Social',
    corporate_promo: 'Corporate / Promo'
  };

  const themeStyles = {
    cinematic: {
      fontFamily: 'Georgia, serif',
      primaryColor: '#1a1a1a',
      secondaryColor: '#666666',
      accentColor: '#d4af37'
    },
    minimal: {
      fontFamily: 'Helvetica, Arial, sans-serif',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#000000'
    },
    editorial: {
      fontFamily: 'Times New Roman, serif',
      primaryColor: '#1a1a1a',
      secondaryColor: '#333333',
      accentColor: '#cc0000'
    },
    bold_art: {
      fontFamily: 'Arial Black, Arial, sans-serif',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#ff6b35'
    },
    brand_deck: {
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#1a1a1a',
      secondaryColor: '#666666',
      accentColor: '#0066cc'
    }
  };

  const style = themeStyles[theme as keyof typeof themeStyles] || themeStyles.cinematic;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${treatment.title}</title>
    <style>
        @page {
            size: A4;
            margin: 1in;
        }
        
        body {
            font-family: ${style.fontFamily};
            color: ${style.primaryColor};
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 2px solid ${style.accentColor};
            padding-bottom: 1rem;
        }
        
        .title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: ${style.primaryColor};
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: ${style.secondaryColor};
            margin-bottom: 0.5rem;
        }
        
        .format-badge {
            display: inline-block;
            background-color: ${style.accentColor};
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: bold;
        }
        
        .section {
            margin-bottom: 2rem;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: ${style.accentColor};
            margin-bottom: 1rem;
            border-bottom: 1px solid ${style.accentColor};
            padding-bottom: 0.3rem;
        }
        
        .section-content {
            font-size: 1rem;
            line-height: 1.7;
            color: ${style.primaryColor};
        }
        
        .loglines {
            background-color: #f8f9fa;
            padding: 1rem;
            border-left: 4px solid ${style.accentColor};
            margin-bottom: 1rem;
        }
        
        .logline {
            margin-bottom: 0.5rem;
            font-style: italic;
        }
        
        .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 0.9rem;
            color: ${style.secondaryColor};
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${treatment.title}</h1>
        <div class="subtitle">${formatLabels[treatment.format as keyof typeof formatLabels] || treatment.format}</div>
        <div class="format-badge">${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</div>
    </div>

    ${content.loglines && content.loglines.length > 0 ? `
    <div class="loglines">
        <h3 style="margin-top: 0; color: ${style.accentColor};">Loglines</h3>
        ${content.loglines.map((logline: string) => `<div class="logline">${logline}</div>`).join('')}
    </div>
    ` : ''}

    ${content.sections ? content.sections.map((section: any) => `
    <div class="section">
        <h2 class="section-title">${section.heading}</h2>
        <div class="section-content">${section.content ? section.content.replace(/\n/g, '<br>') : '<em>No content yet...</em>'}</div>
    </div>
    `).join('') : ''}

    <div class="footer">
        <p>Generated by Preset • ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
  `;
}
