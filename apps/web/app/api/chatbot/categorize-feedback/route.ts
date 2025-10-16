import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface CategorizationResult {
  category: 'bug' | 'feedback' | 'help' | 'suggestion';
  confidence: number;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured for feedback categorization');
      return NextResponse.json({
        success: false,
        category: 'feedback', // Default fallback
        confidence: 0,
        reasoning: 'AI categorization not available',
        fallback: true
      });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('Categorizing feedback content:', { 
      contentLength: content.length,
      hasKey: !!OPENAI_API_KEY,
      keyPrefix: OPENAI_API_KEY?.substring(0, 20) + '...'
    });

    // Call OpenAI API for categorization
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at categorizing user feedback for a creative collaboration platform called Preset. 

Analyze the user's message and categorize it into ONE of these categories:

**bug**: Reports of broken features, errors, crashes, or technical issues
- Examples: "The upload button doesn't work", "I'm getting an error when...", "The app crashed", "Feature X is broken"

**feedback**: General opinions, compliments, complaints, or user experience feedback
- Examples: "I love the new feature", "The interface could be better", "Great platform overall", "User experience is confusing"

**help**: Questions about how to use features, requests for assistance, or clarification
- Examples: "How do I upload photos?", "Can you help me with...", "I don't understand how to...", "What does this feature do?"

**suggestion**: Requests for new features, improvements, or enhancements
- Examples: "It would be great if...", "Can you add a feature for...", "I wish there was a way to...", "Please consider adding..."

Respond with a JSON object containing:
{
  "category": "one of the four categories",
  "confidence": "number between 0 and 1",
  "reasoning": "brief explanation of why you chose this category"
}`
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 200,
        temperature: 0.1, // Low temperature for consistent categorization
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error for categorization:', { 
        status: response.status, 
        statusText: response.statusText, 
        error: error
      });
      
      // Fallback to rule-based categorization
      return NextResponse.json({
        success: true,
        category: fallbackCategorization(content),
        confidence: 0.5,
        reasoning: 'AI categorization failed, using rule-based fallback',
        fallback: true
      });
    }

    const data = await response.json();
    const content_response = data.choices[0]?.message?.content;

    if (!content_response) {
      throw new Error('No response from OpenAI for categorization');
    }

    try {
      // Parse the JSON response
      const categorization = JSON.parse(content_response) as CategorizationResult;
      
      // Validate the response structure
      const validCategories = ['bug', 'feedback', 'help', 'suggestion'];
      if (!validCategories.includes(categorization.category)) {
        throw new Error('Invalid category returned');
      }

      console.log('AI categorization successful:', categorization);

      return NextResponse.json({
        success: true,
        category: categorization.category,
        confidence: categorization.confidence,
        reasoning: categorization.reasoning,
        fallback: false
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI categorization response:', parseError);
      
      // Fallback to rule-based categorization
      return NextResponse.json({
        success: true,
        category: fallbackCategorization(content),
        confidence: 0.5,
        reasoning: 'Failed to parse AI response, using rule-based fallback',
        fallback: true
      });
    }

  } catch (error) {
    console.error('Feedback categorization API error:', error);
    
    // Final fallback
    return NextResponse.json({
      success: true,
      category: 'feedback',
      confidence: 0.3,
      reasoning: 'Categorization failed, defaulting to general feedback',
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Rule-based fallback categorization when AI fails
 */
function fallbackCategorization(content: string): 'bug' | 'feedback' | 'help' | 'suggestion' {
  const lowerContent = content.toLowerCase();
  
  // Bug indicators
  const bugKeywords = [
    'bug', 'error', 'broken', 'crash', 'not working', 'doesn\'t work', 
    'failed', 'failure', 'issue', 'problem', 'glitch', 'fault'
  ];
  
  // Help indicators
  const helpKeywords = [
    'how to', 'how do i', 'help', 'assistance', 'support', 'question',
    'don\'t understand', 'confused', 'explain', 'tutorial', 'guide'
  ];
  
  // Suggestion indicators
  const suggestionKeywords = [
    'suggest', 'recommend', 'would be great', 'could you add', 'feature request',
    'improvement', 'enhancement', 'wish', 'hope', 'please add'
  ];
  
  // Check for bug keywords
  if (bugKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'bug';
  }
  
  // Check for help keywords
  if (helpKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'help';
  }
  
  // Check for suggestion keywords
  if (suggestionKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'suggestion';
  }
  
  // Default to feedback
  return 'feedback';
}
