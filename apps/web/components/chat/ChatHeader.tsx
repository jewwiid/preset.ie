'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Minimize2, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  unreadCount: number;
}

export function ChatHeader({ onClose, onMinimize, unreadCount }: ChatHeaderProps) {
  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Preset Logo */}
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <img
            src="/preset_logo.svg"
            alt="Preset"
            width="20"
            height="20"
            className="text-white"
          />
        </div>

        <div>
          <h3 className="font-semibold text-sm text-white !text-white">Preset Assistant</h3>
          <p className="text-xs text-white/80">How can I help you today?</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onMinimize}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Minimize chat"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
