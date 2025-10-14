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
  const progress = useMemo(
    () => (seconds / maxSeconds) * circumference,
    [seconds, maxSeconds, circumference]
  );

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
                    ${transcribing ? 'opacity-75' : ''}`}
        style={{ width: size, height: size }}
        title={error || undefined}
      >
        {/* Green circle background */}
        <span className="absolute inset-0 rounded-full bg-[#0FA678]" />

        {/* White "p" logo - using existing logo.svg */}
        <Image
          src="/logo.svg"
          alt="Voice input"
          width={Math.floor(size * 0.62)}
          height={Math.floor(size * 0.62)}
          className="relative z-10 select-none pointer-events-none"
        />

        {/* Circular progress ring */}
        <svg className="absolute inset-0" width={size} height={size}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0FA67833"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-200"
          />
        </svg>
      </button>

      {/* Status text */}
      {recording && (
        <span className="text-[10px] text-neutral-600 dark:text-neutral-400">
          {seconds}s / {maxSeconds}s
        </span>
      )}
      {transcribing && (
        <span className="text-[10px] text-neutral-600 dark:text-neutral-400">
          Transcribing...
        </span>
      )}
      {error && (
        <span className="text-[10px] text-red-600 dark:text-red-400 max-w-[120px] text-center">
          {error}
        </span>
      )}
    </div>
  );
}
