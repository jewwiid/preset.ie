# Seedream Provider Information

## 🎯 **What Seedream Uses**

**Seedream** is the default image generation provider in the system and uses:

### **API Service:**
- **Provider**: **Wavespeed.ai** (API platform)
- **Model**: **ByteDance Seedream V4** (AI image generation model)
- **API Endpoints**:
  - Text-to-Image: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4`
  - Image-to-Image: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit`

### **Authentication:**
- **API Key**: `WAVESPEED_API_KEY` environment variable
- **Authorization**: Bearer token authentication

### **Configuration:**
```typescript
// Default provider selection
const provider = selectedProvider || 'seedream' // Default to seedream

// API endpoints
const apiEndpoint = isImageToImage 
  ? 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
  : 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4'

// API request
const response = await fetch(apiEndpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: enhancedPrompt,
    size: finalResolution,
    max_images: 1,
    enable_base64_output: enableBase64Output || false,
    enable_sync_mode: false, // Use async mode for better reliability
    consistency_level: consistencyLevel || 'high'
  })
})
```

## 🎨 **Why Use Seedream**

### **Advantages:**
- ✅ **Reliable**: Well-established API with good uptime
- ✅ **High Quality**: ByteDance Seedream V4 produces excellent images
- ✅ **Fast**: Async processing with polling for results
- ✅ **Flexible**: Supports both text-to-image and image-to-image
- ✅ **Cost Effective**: Reasonable pricing (2 credits per image)
- ✅ **Multiple Resolutions**: Supports various aspect ratios and sizes

### **Features:**
- ✅ **Text-to-Image Generation**: Create images from text prompts
- ✅ **Image-to-Image Generation**: Modify existing images
- ✅ **Style Support**: Works with all style presets
- ✅ **Resolution Flexibility**: Supports non-square aspect ratios
- ✅ **Async Processing**: Better reliability than sync mode
- ✅ **Error Handling**: Graceful handling of API issues

### **Technical Benefits:**
- ✅ **Async Mode**: Uses polling for better reliability
- ✅ **Timeout Handling**: 60-second timeout with retries
- ✅ **Error Recovery**: Handles API errors gracefully
- ✅ **Credit Management**: Proper credit deduction and tracking
- ✅ **Metadata Storage**: Saves generation parameters and results

## 📊 **Comparison with NanoBanana**

| Feature | Seedream | NanoBanana |
|---------|----------|------------|
| **Provider** | Wavespeed.ai | NanoBanana API |
| **Model** | ByteDance Seedream V4 | NanoBanana AI |
| **Cost** | 2 credits per image | 1 credit per image |
| **Processing** | Async polling | Callback-based |
| **Reliability** | High (established) | Good (newer) |
| **Speed** | Fast (30-60s) | Fast (30-60s) |
| **Quality** | Excellent | Excellent |
| **Support** | Text-to-image, Image-to-image | Text-to-image, Image-to-image |

## 🚀 **Recommendation**

**Yes, you should use Seedream** because:

1. ✅ **Default Provider**: It's already the default and most tested
2. ✅ **Reliable**: Well-established API with good uptime
3. ✅ **High Quality**: Produces excellent images consistently
4. ✅ **Cost Effective**: Reasonable pricing at 2 credits per image
5. ✅ **Well Integrated**: Fully integrated with the system
6. ✅ **Error Handling**: Robust error handling and recovery
7. ✅ **Async Processing**: Uses reliable async polling method

**Seedream is the recommended choice** for most users due to its reliability, quality, and comprehensive feature set! 🎨✨
