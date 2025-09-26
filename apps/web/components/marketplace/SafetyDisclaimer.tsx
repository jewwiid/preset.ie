'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, CheckCircle, X } from 'lucide-react';

interface SafetyDisclaimerProps {
  type?: 'listing' | 'order' | 'payment' | 'general';
  compact?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function SafetyDisclaimer({ 
  type = 'general', 
  compact = false,
  onAccept,
  onDecline 
}: SafetyDisclaimerProps) {
  const [accepted, setAccepted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getDisclaimerContent = () => {
    switch (type) {
      case 'listing':
        return {
          title: 'Marketplace Safety Notice',
          summary: 'This is a peer-to-peer marketplace. Preset does not guarantee the condition or authenticity of items.',
          details: [
            'Inspect items thoroughly before payment',
            'Meet in safe, public locations when possible',
            'Use secure payment methods',
            'Report any suspicious activity immediately',
            'Preset is not responsible for item condition or authenticity'
          ]
        };
      case 'order':
        return {
          title: 'Order Safety Guidelines',
          summary: 'Follow these safety guidelines for a secure transaction.',
          details: [
            'Verify item condition matches description',
            'Complete transactions in safe locations',
            'Keep all communication within Preset platform',
            'Report any issues immediately',
            'Preset provides dispute resolution support'
          ]
        };
      case 'payment':
        return {
          title: 'Payment Security Notice',
          summary: 'Your payment is processed securely, but please verify transaction details.',
          details: [
            'Double-check payment amount and recipient',
            'Use secure payment methods only',
            'Keep transaction records',
            'Report unauthorized charges immediately',
            'Preset uses industry-standard security measures'
          ]
        };
      default:
        return {
          title: 'Marketplace Safety',
          summary: 'Stay safe while using our marketplace features.',
          details: [
            'Meet in public, well-lit areas',
            'Bring a friend when possible',
            'Trust your instincts',
            'Report suspicious behavior',
            'Use secure payment methods'
          ]
        };
    }
  };

  const content = getDisclaimerContent();

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.();
  };

  const handleDecline = () => {
    onDecline?.();
  };

  if (compact) {
    return (
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-primary-800 font-medium">{content.title}</p>
            <p className="text-primary-700">{content.summary}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary-200 bg-primary-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-primary-800 mb-2">
              {content.title}
            </h3>
            <p className="text-sm text-primary-700 mb-3">
              {content.summary}
            </p>
            
            {showDetails && (
              <div className="mb-4">
                <ul className="text-sm text-primary-700 space-y-1">
                  {content.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 text-primary-600 mt-1 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-primary-700 hover:text-primary-800 hover:bg-primary-100"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>

              {onAccept && onDecline && !accepted && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecline}
                    className="text-primary-700 border-primary-300 hover:bg-primary-100"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="bg-primary-600 hover:bg-primary-700 text-primary-foreground"
                  >
                    Accept & Continue
                  </Button>
                </div>
              )}
            </div>

            {accepted && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-primary-700">
                <CheckCircle className="h-4 w-4" />
                <span>Safety guidelines acknowledged</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
