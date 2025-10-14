'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVoiceToTextOptions {
  maxSeconds?: number;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceToText({ 
  maxSeconds = 30,
  onTranscript,
  onError 
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

      const res = await fetch('/api/transcribe', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd 
      });

      const { text, error } = await res.json();
      
      if (error) {
        onError?.(error);
      } else if (text) {
        onTranscript?.(text);
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
