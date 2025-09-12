/**
 * Test Script for Content Moderation System
 * This script tests the bad word filtering and duplicate detection
 */

import { validateCustomTag, checkTagDuplicate, validateAndCheckTag } from '../apps/web/lib/contentModeration.js'

// Test cases for content validation
const testCases = [
  // Valid cases
  { tag: 'artistic', type: 'style', expectValid: true },
  { tag: 'creative', type: 'vibe', expectValid: true },
  { tag: 'minimalist', type: 'style', expectValid: true },
  { tag: 'modern-chic', type: 'style', expectValid: true },
  
  // Invalid cases - inappropriate content
  { tag: 'sexy', type: 'style', expectValid: false, reason: 'inappropriate' },
  { tag: 'fucking awesome', type: 'vibe', expectValid: false, reason: 'profanity' },
  { tag: 'buy now', type: 'style', expectValid: false, reason: 'spam' },
  
  // Invalid cases - format issues
  { tag: 'a', type: 'style', expectValid: false, reason: 'too short' },
  { tag: 'thistagiswaytoolongandexceedsthe20characterlimit', type: 'vibe', expectValid: false, reason: 'too long' },
  { tag: 'tag@with$special', type: 'style', expectValid: false, reason: 'special characters' },
  { tag: 'aaaaaaa', type: 'style', expectValid: false, reason: 'repetitive' },
  
  // Edge cases
  { tag: '  spaces  ', type: 'style', expectValid: true }, // Should be trimmed
  { tag: 'MiXeD-CaSe', type: 'vibe', expectValid: true }, // Should handle case
]

async function runTests() {
  console.log('🧪 Testing Content Moderation System\n')
  
  let passed = 0
  let failed = 0
  
  for (const testCase of testCases) {
    try {
      const result = await validateCustomTag(testCase.tag)
      
      if (result.isValid === testCase.expectValid) {
        console.log(`✅ PASS: "${testCase.tag}" -> ${result.isValid ? 'valid' : 'invalid'}`)
        if (!result.isValid && result.reason) {
          console.log(`   Reason: ${result.reason}`)
        }
        passed++
      } else {
        console.log(`❌ FAIL: "${testCase.tag}" -> Expected: ${testCase.expectValid}, Got: ${result.isValid}`)
        if (result.reason) {
          console.log(`   Reason: ${result.reason}`)
        }
        failed++
      }
    } catch (error) {
      console.log(`💥 ERROR: "${testCase.tag}" -> ${error.message}`)
      failed++
    }
    
    console.log() // Empty line for readability
  }
  
  console.log(`\n📊 Test Results:`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  
  // Test specific bad words
  console.log('\n🚫 Testing Bad Words Detection:')
  const badWords = ['fuck', 'shit', 'porn', 'xxx', 'drugs', 'illegal']
  
  for (const word of badWords) {
    const result = await validateCustomTag(word)
    if (!result.isValid) {
      console.log(`✅ Correctly blocked: "${word}"`)
    } else {
      console.log(`❌ Should have blocked: "${word}"`)
    }
  }
  
  // Test length limits
  console.log('\n📏 Testing Length Limits:')
  const lengths = [
    { tag: 'x', expectValid: false },
    { tag: 'ab', expectValid: true },
    { tag: 'normal-length-tag', expectValid: true },
    { tag: 'this-is-exactly-20-c', expectValid: true },
    { tag: 'this-tag-is-too-long-21', expectValid: false },
  ]
  
  for (const test of lengths) {
    const result = await validateCustomTag(test.tag)
    const status = result.isValid === test.expectValid ? '✅' : '❌'
    console.log(`${status} "${test.tag}" (${test.tag.length} chars) -> ${result.isValid ? 'valid' : 'invalid'}`)
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error)
}

export { runTests }