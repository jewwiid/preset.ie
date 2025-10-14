'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { aiDetectMentions, type MentionDetectionContext } from '@/lib/ai/mention-detection';
import type { MentionableEntity } from '@/lib/utils/mention-types';

interface UseVoiceToTextOptions {
  maxSeconds?: number;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  // Enhanced AI mention detection options
  enableAIMentions?: boolean;
  mentionContext?: MentionDetectionContext;
  availableEntities?: MentionableEntity[];
}

export function useVoiceToText({ 
  maxSeconds = 30,
  onTranscript,
  onError,
  // Enhanced AI mention detection options
  enableAIMentions = false,
  mentionContext,
  availableEntities = []
}: UseVoiceToTextOptions = {}) {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (recording) {
      setSeconds(0);
      timer = setInterval(() => setSeconds(s => {
        if (s + 1 >= maxSeconds) {
          stop();
          return s;
        }
        return s + 1;
      }), 1000);
    }
    return () => clearInterval(timer);
  }, [recording, maxSeconds]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => handleStop();
      
      recRef.current = rec;
      setRecording(true);
      rec.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      onError?.(message);
    }
  }, [onError]);

  const stop = useCallback(() => {
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop();
      recRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
  }, []);

  const handleStop = useCallback(async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    if (blob.size === 0) return;

    setTranscribing(true);
    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fd = new FormData();
      fd.append('file', blob, 'speech.webm');

      console.log('Sending transcription request...');
      const res = await fetch('/api/transcribe', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd 
      });

      console.log(`Transcription response status: ${res.status}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Transcription API error:', errorData);
        onError?.(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        return;
      }

      const { text, error } = await res.json();
      
      if (error) {
        console.error('Transcription error:', error);
        onError?.(error);
      } else if (text) {
        console.log('Transcription successful:', text);
        
        // Enhanced processing with AI mention detection
        if (enableAIMentions && mentionContext && availableEntities.length > 0) {
          try {
            console.log('Running AI mention detection on transcribed text...');
            const mentionResult = await aiDetectMentions(
              text,
              mentionContext,
              availableEntities,
              {
                confidence: 0.7,
                maxMentions: 20,
                preserveOriginal: true,
                timeout: 10000
              }
            );
            
            console.log('AI mention detection successful:', {
              detectedCount: mentionResult.detectedEntities.length,
              confidence: mentionResult.confidence,
              textChanged: mentionResult.mentionedText !== mentionResult.originalText
            });
            
            // Use the enhanced text with mentions
            onTranscript?.(mentionResult.mentionedText);
          } catch (mentionError) {
            console.warn('AI mention detection failed, using original transcription:', mentionError);
            // Fall back to original transcription
            onTranscript?.(text);
          }
        } else {
          // Use original transcription
          onTranscript?.(text);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      onError?.(message);
    } finally {
      setTranscribing(false);
    }
  }, [onTranscript, onError]);

  return { recording, seconds, transcribing, start, stop };
}
