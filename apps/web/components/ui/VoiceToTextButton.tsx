'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useVoiceToText } from '@/hooks/useVoiceToText';

interface VoiceToTextButtonProps {
  onAppendText: (text: string) => void;
  size?: number;
  stroke?: number;
  color?: string;
  maxSeconds?: number;
  disabled?: boolean;
}

export default function VoiceToTextButton({
  onAppendText,
  size = 44,
  stroke = 4,
  color = '#0FA678',
  maxSeconds = 30,
  disabled = false
}: VoiceToTextButtonProps) {
  const [error, setError] = useState<string | null>(null);

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
    <div className="relative inline-flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={recording ? 'Stop recording' : 'Start voice input'}
        aria-pressed={recording}
        onClick={recording ? stop : start}
        disabled={disabled || transcribing}
        className={`relative inline-flex items-center justify-center rounded-full transition-all
                    ${recording ? 'preset-pulse' : 'hover:scale-105'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
  );
}
