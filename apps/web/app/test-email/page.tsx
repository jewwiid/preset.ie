'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestEmail = async () => {
    if (!email) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Failed to send test email. Please check your Plunk configuration.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Test Plunk Email Integration</CardTitle>
          <CardDescription>
            Send a test email to verify your Plunk configuration is working correctly
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button 
            onClick={sendTestEmail} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>What this tests:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Plunk API key configuration</li>
              <li>Email template rendering</li>
              <li>Brand color application</li>
              <li>Email delivery</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
