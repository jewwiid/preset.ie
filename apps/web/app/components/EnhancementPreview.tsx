'use client';

import { useState, useEffect } from 'react';

interface EnhancementPreviewProps {
  originalImage: string;
  taskId: string;
  enhancementType: string;
  prompt: string;
  onComplete?: (resultUrl: string) => void;
  onError?: (error: string) => void;
}

export default function EnhancementPreview({
  originalImage,
  taskId,
  enhancementType,
  prompt,
  onComplete,
  onError
}: EnhancementPreviewProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing enhancement...');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('EnhancementPreview mounted for task:', taskId);
    
    // Simulate progress for better UX
    const progressSteps = [
      { progress: 10, status: 'Analyzing image...', delay: 1000 },
      { progress: 25, status: 'Applying AI enhancement...', delay: 3000 },
      { progress: 40, status: `Processing ${enhancementType} style...`, delay: 5000 },
      { progress: 60, status: 'Refining details...', delay: 8000 },
      { progress: 75, status: 'Finalizing enhancement...', delay: 12000 },
      { progress: 90, status: 'Almost ready...', delay: 15000 }
    ];

    progressSteps.forEach(step => {
      setTimeout(() => {
        setProgress(step.progress);
        setStatus(step.status);
      }, step.delay);
    });

    // Poll for actual result (checking database for callback update)
    const pollInterval = setInterval(async () => {
      try {
        console.log('Polling enhancement status for task:', taskId);
        const response = await fetch(`/api/enhancement-status/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Polling response:', data);
          
          if (data.status === 'completed' && data.resultUrl) {
            console.log('✅ Enhancement completed! Result URL:', data.resultUrl);
            setProgress(100);
            setStatus('Enhancement complete!');
            setResultUrl(data.resultUrl);
            clearInterval(pollInterval);
            if (onComplete) onComplete(data.resultUrl);
          } else if (data.status === 'failed') {
            console.log('❌ Enhancement failed:', data.error);
            setError(data.error || 'Enhancement failed');
            clearInterval(pollInterval);
            if (onError) onError(data.error);
          } else {
            console.log('⏳ Still processing, status:', data.status);
          }
        } else {
          console.error('Polling failed with status:', response.status);
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      }
    }, 2000); // Check every 2 seconds for faster response

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (!resultUrl && !error) {
        setError('Enhancement timed out. Please try again.');
        if (onError) onError('Timeout');
      }
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [taskId, enhancementType, onComplete, onError, resultUrl, error]);

  return (
    <div className="relative w-full">
      {/* Original Image with Overlay */}
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={originalImage}
          alt="Original"
          className={`w-full h-auto ${!resultUrl ? 'filter blur-sm' : ''} transition-all duration-500`}
        />
        
        {/* Loading Overlay */}
        {!resultUrl && !error && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            {/* Animated Processing Effect */}
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-ping opacity-25"></div>
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-border rounded-full animate-pulse"></div>
            </div>

            {/* Progress Bar */}
            <div className="w-3/4 max-w-md mb-4">
              <div className="bg-muted-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary/90 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Status Text */}
            <p className="text-primary-foreground text-sm font-medium mb-2">{status}</p>
            <p className="text-muted-foreground-300 text-xs">{progress}% Complete</p>

            {/* Prompt Display */}
            <div className="mt-6 px-6 py-3 bg-background bg-opacity-10 rounded-lg backdrop-blur">
              <p className="text-muted-foreground-200 text-xs">Enhancement Type: <span className="font-semibold">{enhancementType}</span></p>
              <p className="text-muted-foreground-200 text-xs mt-1">Prompt: <span className="font-semibold">{prompt}</span></p>
            </div>
          </div>
        )}

        {/* Result Image (Fade In) */}
        {resultUrl && (
          <div className="absolute inset-0">
            <img
              src={resultUrl}
              alt="Enhanced"
              className="w-full h-full object-cover animate-fadeIn"
            />
            <div className="absolute bottom-4 right-4 bg-primary-500 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Enhanced
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-destructive-500 bg-opacity-90 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-primary-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-primary-foreground font-semibold mb-2">Enhancement Failed</p>
            <p className="text-muted-foreground-200 text-sm px-6 text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Task ID Display */}
      <div className="mt-2 text-xs text-muted-foreground-500 text-center">
        Task ID: {taskId}
      </div>
    </div>
  );
}