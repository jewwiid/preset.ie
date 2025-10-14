'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { useAuth } from '@/lib/auth-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';
import { Crown, Mic } from 'lucide-react';

interface VoiceToTextButtonProps {
  onAppendText: (text: string) => void;
  size?: number;
  stroke?: number;
  color?: string;
  maxSeconds?: number;
  disabled?: boolean;
  userSubscriptionTier?: 'FREE' | 'PLUS' | 'PRO';
}

export default function VoiceToTextButton({
  onAppendText,
  size = 44,
  stroke = 4,
  color = '#0FA678',
  maxSeconds = 30,
  disabled = false,
  userSubscriptionTier
}: VoiceToTextButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine if voice-to-text is disabled due to subscription
  const isSubscriptionDisabled = userSubscriptionTier === 'FREE' || (!userSubscriptionTier && user?.user_metadata?.subscription_tier === 'FREE');
  const isDisabled = disabled || isSubscriptionDisabled;

  const { recording, seconds, transcribing, start, stop } = useVoiceToText({
    maxSeconds,
    onTranscript: (text) => {
      setError(null);
      onAppendText(text);
    },
    onError: (err) => setError(err)
  });

  const radius = useMemo(() => (size - stroke) / 2, [size, stroke]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  // Calculate progress as remaining time (starts full, decreases to empty)
  const progress = useMemo(
    () => ((maxSeconds - seconds) / maxSeconds) * circumference,
    [seconds, maxSeconds, circumference]
  );

  // Calculate color based on remaining time (green when full, red when empty)
  const getProgressColor = useMemo(() => {
    if (error) return "#ef4444"; // Red for errors
    if (!recording) return "transparent"; // No ring when not recording
    
    const remainingRatio = (maxSeconds - seconds) / maxSeconds;
    // Interpolate from green (#0FA678) to red (#ef4444) as time runs out
    const green = Math.floor(15 + (239 - 15) * remainingRatio); // 15 to 239
    const red = Math.floor(15 + (239 - 15) * (1 - remainingRatio)); // 15 to 239
    const blue = Math.floor(120 + (68 - 120) * (1 - remainingRatio)); // 120 to 68
    
    return `rgb(${red}, ${green}, ${blue})`;
  }, [recording, seconds, maxSeconds, error]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label={recording ? 'Stop recording' : 'Start voice input'}
              aria-pressed={recording}
              onClick={recording ? stop : start}
              disabled={isDisabled || transcribing}
              className={`relative inline-flex items-center justify-center rounded-full transition-all
                          ${recording ? 'preset-pulse' : 'hover:scale-105'}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${transcribing ? 'opacity-75' : ''}
                          ${error ? 'animate-pulse' : ''}`}
              style={{ width: size, height: size }}
              title={error || undefined}
            >
        {/* "p" logo - using existing logo.svg */}
        <Image
          src="/logo.svg"
          alt="Voice input"
          width={Math.floor(size * 0.62)}
          height={Math.floor(size * 0.62)}
          className="relative z-10 select-none pointer-events-none"
        />

        {/* Circular progress ring */}
        <svg className="absolute inset-0" width={size} height={size}>
          {/* Background ring - subtle gray */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress ring - green to red transition based on remaining time */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getProgressColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-200"
          />
        </svg>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {error ? (
            <div className="text-center">
              <p className="text-red-600 font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : isSubscriptionDisabled ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <p className="font-medium">Voice-to-Text</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Voice transcription requires a PLUS or PRO subscription
              </p>
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={() => window.open('/subscription', '_blank')}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade Now
              </Button>
            </div>
          ) : recording ? (
            <div className="text-center">
              <p className="font-medium">Recording...</p>
              <p className="text-sm text-muted-foreground">
                {maxSeconds - seconds}s remaining
              </p>
            </div>
          ) : transcribing ? (
            <div className="text-center">
              <p className="font-medium">Transcribing...</p>
              <p className="text-sm text-muted-foreground">
                Converting speech to text
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <p className="font-medium">Voice-to-Text</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Click to start recording your prompt
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
