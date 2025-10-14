'use client';

import { useState } from 'react';
import VoiceToTextButton from '@/components/ui/VoiceToTextButton';

export default function TestVoicePage() {
  const [text, setText] = useState('');

  const appendText = async (newText: string) => {
    // Typewriter effect
    const base = text.endsWith(' ') || !text ? text : text + ' ';
    let out = base;
    setText(out);
    for (let i = 0; i < newText.length; i++) {
      out += newText[i];
      setText(out);
      await new Promise(r => setTimeout(r, 8));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Voice-to-Text Test</h1>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Test the Voice Input</h2>
          <p className="text-muted-foreground mb-4">
            Click the voice button below to test the voice-to-text functionality. 
            Make sure you have a microphone connected and browser permissions granted.
          </p>
          
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your transcribed text will appear here..."
              rows={6}
              className="w-full px-4 py-3 pr-14 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
            <div className="absolute right-2 bottom-2">
              <VoiceToTextButton
                onAppendText={appendText}
                disabled={false} // Test with enabled for demo
              />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Features to test:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Click to start recording (30 second limit)</li>
              <li>Circular progress timer animation</li>
              <li>Pulse animation during recording</li>
              <li>Typewriter effect for transcribed text</li>
              <li>Error handling for mic permissions</li>
              <li>Free for PLUS/PRO subscribers (no credit cost)</li>
            </ul>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>API Route:</strong> /api/transcribe</p>
            <p><strong>Hook:</strong> useVoiceToText</p>
            <p><strong>Component:</strong> VoiceToTextButton</p>
            <p><strong>Integration:</strong> Playground, Gig Creation, Showcase, Moodboard</p>
            <p><strong>Subscription:</strong> PLUS/PRO users only</p>
            <p><strong>Cost:</strong> Free for PLUS/PRO subscribers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
