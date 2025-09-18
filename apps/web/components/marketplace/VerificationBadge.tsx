'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface VerificationBadgeProps {
  verified: boolean;
  verificationType?: 'id' | 'email' | 'phone' | 'payment';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function VerificationBadge({ 
  verified, 
  verificationType = 'id', 
  size = 'md',
  showText = true 
}: VerificationBadgeProps) {
  const getIcon = () => {
    if (verified) {
      return <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />;
    }
    return <Clock className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />;
  };

  const getText = () => {
    if (!showText) return '';
    
    if (verified) {
      switch (verificationType) {
        case 'id':
          return 'Verified ID';
        case 'email':
          return 'Verified Email';
        case 'phone':
          return 'Verified Phone';
        case 'payment':
          return 'Verified Payment';
        default:
          return 'Verified';
      }
    } else {
      switch (verificationType) {
        case 'id':
          return 'Unverified';
        case 'email':
          return 'Unverified Email';
        case 'phone':
          return 'Unverified Phone';
        case 'payment':
          return 'Unverified Payment';
        default:
          return 'Unverified';
      }
    }
  };

  const getBadgeVariant = () => {
    if (verified) {
      return 'default';
    }
    return 'secondary';
  };

  const getBadgeClass = () => {
    if (verified) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={`${getBadgeClass()} flex items-center space-x-1 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}
    >
      {getIcon()}
      {showText && <span>{getText()}</span>}
    </Badge>
  );
}
