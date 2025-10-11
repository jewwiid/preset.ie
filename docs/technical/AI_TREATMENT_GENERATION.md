# AI-Powered Treatment Generation

The treatment system now supports AI-powered content generation using OpenAI's GPT-4o and GPT-4o-mini models, with automatic fallback to template-based generation when AI is unavailable.

## Features

### 🤖 AI Generation
- **Dual-model support** - GPT-4o (best quality) and GPT-4o-mini (cost-effective)
- **Real-time content creation** with OpenAI's latest models
- **Context-aware generation** using gig data and moodboard information
- **🖼️ Image analysis** - Analyzes moodboard and gig images for visual context
- **Format-specific prompts** optimized for different treatment types
- **Parallel section generation** for improved performance
- **Model selection** based on quality vs cost requirements

### 📝 Template Fallback
- **Automatic fallback** when OpenAI API is unavailable
- **Same output format** ensuring seamless user experience
- **No functionality loss** when AI is disabled

## Supported Formats

1. **Film/TV** - Industry-standard film and television treatments
2. **Commercial/Brand** - Brand-focused commercial treatments
3. **Documentary** - Authentic documentary treatments
4. **Music Video** - Visual storytelling for music videos
5. **Short/Social** - Short-form and social media content
6. **Corporate Promo** - Professional corporate presentations

## API Usage

### Generate Treatment Draft

```bash
POST /api/treatments/generate-draft
Content-Type: application/json

{
  "title": "My Amazing Project",
  "format": "film_tv",
  "theme": "cinematic",
  "gig_id": "optional-gig-id",
  "moodboard_id": "optional-moodboard-id"
}
```

### Response Format

```json
{
  "loglines": [
    {
      "text": "Compelling logline text",
      "type": "hook|character|conflict|stake"
    }
  ],
  "sections": {
    "premise": {
      "content": "Generated content...",
      "wordCount": 150
    },
    "characters": {
      "content": "Character descriptions...",
      "wordCount": 200
    }
  },
  "cta_suggestions": [
    {
      "label": "Hire DP",
      "target": "crew:dp"
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Model Selection (optional, defaults to gpt4o_mini)
AI_TREATMENT_MODEL=gpt4o        # Best quality
# AI_TREATMENT_MODEL=gpt4o_mini    # Most cost-effective
```

### Model Comparison

| Model | Best For | Cost (per 1M tokens) | Quality |
|-------|----------|----------------------|---------|
| **GPT-4o** | Best quality, complex instructions | $5 input, $15 output | ⭐⭐⭐⭐⭐ |
| **GPT-4o-mini** | High volume, cost-sensitive | $0.15 input, $0.6 output | ⭐⭐⭐⭐ |

### Fallback Behavior

When `OPENAI_API_KEY` is not configured or AI generation fails:
- System automatically falls back to template-based generation
- Same API response format maintained
- User experience remains consistent
- Logs indicate which generation method was used

## Implementation Details

### AI Service Architecture

- **`openai-treatment-service.ts`** - Core AI generation logic
- **Context building** - Extracts relevant data from gigs and moodboards
- **🖼️ Image analysis** - Analyzes moodboard and gig images for visual context
- **Format-specific prompts** - Optimized prompts for each treatment type
- **Error handling** - Graceful fallback to templates

### Image Analysis Integration

- **Moodboard images** - Analyzes all images from moodboards for visual context
- **Gig images** - Extracts and analyzes images from gig media
- **Visual insights** - Extracts color palettes, mood, and visual style
- **Enhanced context** - Uses visual analysis to improve treatment quality
- **Cost optimization** - Limits analysis to 8 images for cost control

### Performance Optimizations

- **Parallel section generation** - Multiple sections generated simultaneously
- **Efficient token usage** - Optimized prompts to minimize API costs
- **Caching ready** - Structure supports future caching implementation

### Quality Assurance

- **Word count limits** - Enforced per section to maintain quality
- **Format validation** - Ensures output matches expected structure
- **Error recovery** - Comprehensive error handling and logging

## Development

### Testing AI Integration

1. Set `OPENAI_API_KEY` in your environment
2. Make API calls to `/api/treatments/generate-draft`
3. Check server logs for AI generation confirmation
4. Verify content quality and format compliance

### Testing Fallback

1. Remove or invalidate `OPENAI_API_KEY`
2. Make API calls to `/api/treatments/generate-draft`
3. Verify template-based generation works
4. Confirm same response format

## Future Enhancements

- **Custom model fine-tuning** for treatment-specific content
- **Multi-provider support** (Anthropic, Google AI, etc.)
- **Content caching** for improved performance
- **User preference learning** for personalized generation
- **Batch processing** for multiple treatments

## Troubleshooting

### Common Issues

1. **AI generation fails** - Check OpenAI API key and credits
2. **Slow responses** - Normal for AI generation, consider caching
3. **Content quality** - Adjust prompts in `openai-treatment-service.ts`
4. **Format errors** - Verify treatment format enum values

### Logs to Monitor

- `🤖 Generating treatment with AI...` - AI generation started
- `✅ AI generation successful` - AI generation completed
- `⚠️ AI generation failed, falling back to templates` - Fallback triggered
- `📝 Using template-based generation...` - Template generation started
