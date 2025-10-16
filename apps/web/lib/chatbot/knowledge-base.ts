/**
 * Knowledge Base System for Preset Chatbot
 * 
 * This module provides a knowledge base system that converts the developer guide
 * documentation into searchable content for the AI chatbot.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  categorySlug?: string;
  keywords: string[];
  section: string;
  priority?: number;
  source?: string;
  publishedAt?: string;
}

export interface SearchResult {
  item: KnowledgeItem;
  relevanceScore: number;
  matchedKeywords: string[];
}

class KnowledgeBase {
  private knowledgeItems: KnowledgeItem[] = [];
  private isLoaded = false;

  constructor() {
    // Start loading knowledge base asynchronously
    this.loadKnowledgeBase().catch(error => {
      console.error('Failed to load knowledge base:', error);
      this.addFallbackKnowledge();
      this.isLoaded = true;
    });
  }

  /**
   * Load knowledge base from developer guide documentation
   */
  private async loadKnowledgeBase(): Promise<void> {
    try {
      // Try to load knowledge base from API endpoint (works in production)
      try {
        const response = await fetch('/api/chatbot/knowledge-base');
        if (response.ok) {
          const data = await response.json();
          this.knowledgeItems = data.items || [];
          this.isLoaded = true;
          console.log(`Knowledge base loaded from API with ${this.knowledgeItems.length} items`);
          return;
        }
      } catch (apiError) {
        console.warn('Failed to load knowledge base from API, falling back to file system:', apiError);
      }

      // Fallback to file system loading (development)
      const docsPath = join(process.cwd(), 'docs', 'developer-guide');
      
      // Define the knowledge sections with their file mappings
      const knowledgeSections = [
        {
          file: '01-Platform-Overview.md',
          category: 'platform',
          keywords: ['overview', 'what is preset', 'platform', 'features', 'user roles', 'business model']
        },
        {
          file: '02-Architecture-Technical-Stack.md',
          category: 'technical',
          keywords: ['architecture', 'tech stack', 'database', 'api', 'security', 'performance']
        },
        {
          file: '03-Core-Features-Implementation.md',
          category: 'features',
          keywords: ['gigs', 'applications', 'showcases', 'messaging', 'ai features', 'moodboard']
        },
        {
          file: '04-Monetization-Business-Model.md',
          category: 'business',
          keywords: ['pricing', 'subscription', 'credits', 'revenue', 'business model', 'tiers']
        },
        {
          file: '05-Safety-Trust-Systems.md',
          category: 'safety',
          keywords: ['safety', 'trust', 'moderation', 'verification', 'privacy', 'nsfw', 'content filtering']
        },
        {
          file: '06-Development-Workflow.md',
          category: 'development',
          keywords: ['development', 'setup', 'workflow', 'testing', 'deployment', 'environment']
        },
        {
          file: '07-API-Documentation.md',
          category: 'api',
          keywords: ['api', 'endpoints', 'authentication', 'requests', 'responses', 'documentation']
        }
      ];

      // Load each documentation section
      for (const section of knowledgeSections) {
        try {
          const filePath = join(docsPath, section.file);
          const content = readFileSync(filePath, 'utf-8');
          
          // Parse markdown content into structured knowledge items
          const items = this.parseMarkdownContent(content, section);
          this.knowledgeItems.push(...items);
        } catch (error) {
          console.warn(`Failed to load ${section.file}:`, error);
        }
      }

      // Add some quick reference knowledge items
      this.addQuickReferenceItems();

      this.isLoaded = true;
      console.log(`Knowledge base loaded with ${this.knowledgeItems.length} items`);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      // Fallback to basic knowledge items
      this.addFallbackKnowledge();
      this.isLoaded = true;
    }
  }

  /**
   * Parse markdown content into structured knowledge items
   */
  private parseMarkdownContent(content: string, section: any): KnowledgeItem[] {
    const items: KnowledgeItem[] = [];
    
    // Split content by headers (## and ###)
    const sections = content.split(/^##\s+/m);
    
    for (let i = 0; i < sections.length; i++) {
      const sectionContent = sections[i].trim();
      if (!sectionContent) continue;
      
      const lines = sectionContent.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim();
      
      if (!title || title.length < 3) continue;
      
      // Extract content (skip the title line)
      const contentLines = lines.slice(1);
      const itemContent = contentLines.join('\n').trim();
      
      // Extract additional keywords from the content
      const additionalKeywords = this.extractKeywordsFromContent(itemContent);
      
      items.push({
        id: `${section.category}-${i}`,
        title: title,
        content: itemContent,
        category: section.category,
        keywords: [...section.keywords, ...additionalKeywords],
        section: section.file.replace('.md', '')
      });
    }
    
    return items;
  }

  /**
   * Extract keywords from content for better search
   */
  private extractKeywordsFromContent(content: string): string[] {
    const keywords: string[] = [];
    
    // Extract important terms (words in bold, quotes, or common patterns)
    const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      keywords.push(...boldMatches.map(m => m.replace(/\*\*/g, '').toLowerCase()));
    }
    
    // Extract code blocks and technical terms
    const codeMatches = content.match(/`([^`]+)`/g);
    if (codeMatches) {
      keywords.push(...codeMatches.map(m => m.replace(/`/g, '').toLowerCase()));
    }
    
    // Extract common platform terms
    const platformTerms = ['gig', 'talent', 'contributor', 'application', 'showcase', 'moodboard', 'subscription', 'credits'];
    platformTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Add quick reference items for common questions
   */
  private addQuickReferenceItems(): void {
    const quickRefItems: KnowledgeItem[] = [
      {
        id: 'quick-how-to-create-gig',
        title: 'How to Create a Gig',
        content: `To create a gig on Preset:

1. Click "Create Gig" from your dashboard
2. Fill in the gig details:
   - Title and description
   - Location (with map picker)
   - Date and time
   - Compensation type (TFP, Paid, Expenses)
   - Application deadline
3. Upload moodboard images
4. Set requirements and safety notes
5. Publish the gig

Your gig will appear in the gig listings for talent to discover and apply.`,
        category: 'quick-help',
        keywords: ['create gig', 'post gig', 'new gig', 'gig creation', 'how to'],
        section: 'quick-reference'
      },
      {
        id: 'quick-how-to-apply',
        title: 'How to Apply to Gigs',
        content: `To apply to gigs as talent:

1. Browse available gigs in your area
2. Use filters to find relevant opportunities
3. Click on a gig to view details
4. Review the moodboard and requirements
5. Click "Apply" and add a personal note
6. Wait for the contributor to review your application

Free tier allows 3 applications per month. Plus and Pro tiers have unlimited applications.`,
        category: 'quick-help',
        keywords: ['apply', 'application', 'talent', 'how to apply', 'find gigs'],
        section: 'quick-reference'
      },
      {
        id: 'quick-subscription-tiers',
        title: 'Subscription Tiers',
        content: `Preset offers different subscription tiers:

**Talent Tiers:**
- Free: 3 applications/month, 3 showcases
- Plus (€9/mo): Unlimited applications, 10 showcases, analytics
- Pro (€19/mo): Unlimited everything, priority visibility

**Contributor Tiers:**
- Free: 2 gigs/month, 10 applications per gig
- Plus (€12/mo): Unlimited gigs, 50 applications per gig
- Pro (€24/mo): Unlimited everything, team access

All tiers include basic AI features. Pro tiers get enhanced AI capabilities.`,
        category: 'quick-help',
        keywords: ['subscription', 'pricing', 'tiers', 'free', 'plus', 'pro', 'cost'],
        section: 'quick-reference'
      },
      {
        id: 'quick-safety-features',
        title: 'Safety Features',
        content: `Preset prioritizes user safety with:

- Email verification required for all accounts
- Optional ID verification for enhanced trust
- Content moderation using AI
- In-app messaging only (no external contact initially)
- Easy reporting and blocking features
- Public venue recommendations
- Optional safety check-ins

Report any inappropriate behavior through the chat or contact support.`,
        category: 'quick-help',
        keywords: ['safety', 'trust', 'verification', 'moderation', 'report', 'block'],
        section: 'quick-reference'
      },
      {
        id: 'quick-showcases',
        title: 'Showcases and Portfolios',
        content: `Showcases are collaborative portfolios built from completed gigs:

- Both contributor and talent upload 3-6 selects from shoots
- Mutual approval required before publication
- Automatic crediting on both profiles
- Public galleries for discovery
- Contributes to professional reputation

Showcases help build your portfolio and attract future collaborations.`,
        category: 'quick-help',
        keywords: ['showcase', 'portfolio', 'collaboration', 'gallery', 'credits'],
        section: 'quick-reference'
      }
    ];

    this.knowledgeItems.push(...quickRefItems);
  }

  /**
   * Add fallback knowledge for when docs can't be loaded
   */
  private addFallbackKnowledge(): void {
    this.knowledgeItems = [
      {
        id: 'fallback-basic-help',
        title: 'Basic Help',
        content: 'Preset is a creative collaboration platform connecting photographers with talent. Use the menu to navigate to gigs, applications, or your dashboard.',
        category: 'fallback',
        keywords: ['help', 'basic', 'navigation'],
        section: 'fallback'
      }
    ];
  }

  /**
   * Search the knowledge base for relevant information
   */
  public search(query: string, maxResults = 5): SearchResult[] {
    if (!this.isLoaded) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    const results: SearchResult[] = [];

    for (const item of this.knowledgeItems) {
      let relevanceScore = 0;
      const matchedKeywords: string[] = [];

      // Check title match (highest weight)
      if (item.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10;
      }

      // Check keyword matches
      for (const keyword of item.keywords) {
        if (queryWords.some(word => keyword.includes(word))) {
          relevanceScore += 3;
          matchedKeywords.push(keyword);
        }
      }

      // Check content match (lower weight)
      const contentLower = item.content.toLowerCase();
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          relevanceScore += 1;
        }
      }

      // Check category relevance
      if (this.isCategoryRelevant(queryLower, item.category)) {
        relevanceScore += 2;
      }

      if (relevanceScore > 0) {
        results.push({
          item,
          relevanceScore,
          matchedKeywords: [...new Set(matchedKeywords)]
        });
      }
    }

    // Sort by relevance score and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Check if query is relevant to a specific category
   */
  private isCategoryRelevant(query: string, category: string): boolean {
    const categoryKeywords: { [key: string]: string[] } = {
      platform: ['what is', 'overview', 'features', 'platform'],
      technical: ['api', 'database', 'technical', 'architecture'],
      features: ['gig', 'application', 'showcase', 'moodboard', 'messaging'],
      business: ['pricing', 'subscription', 'cost', 'tier', 'payment'],
      safety: ['safety', 'trust', 'verification', 'moderation', 'report'],
      development: ['development', 'setup', 'environment', 'testing'],
      api: ['api', 'endpoint', 'request', 'response']
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Get knowledge context for AI prompt
   */
  public getContextForPrompt(query: string, maxContextLength = 2000): string {
    const searchResults = this.search(query, 5);
    
    if (searchResults.length === 0) {
      return 'No specific documentation found for this query. Please provide general assistance.';
    }

    let context = 'Relevant Preset platform information:\n\n';
    
    for (const result of searchResults) {
      const source = result.item.source === 'help_articles' ? 'Help Article' : 'Knowledge Base';
      const content = result.item.excerpt || result.item.content;
      const truncatedContent = content.length > 500 
        ? content.substring(0, 500) + '...'
        : content;
      
      context += `**${result.item.title}** (${source} - ${result.item.category}):\n${truncatedContent}\n\n`;
      
      if (context.length > maxContextLength) {
        break;
      }
    }

    return context;
  }

  /**
   * Get all knowledge items (for debugging/admin)
   */
  public getAllItems(): KnowledgeItem[] {
    return [...this.knowledgeItems];
  }

  /**
   * Get items by category
   */
  public getItemsByCategory(category: string): KnowledgeItem[] {
    return this.knowledgeItems.filter(item => item.category === category);
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBase();

// Types are already exported above
