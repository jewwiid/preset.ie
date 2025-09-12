'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button';
import { Coins, Plus } from 'lucide-react';
import Link from 'next/link';

interface CreditBalanceProps {
  className?: string;
  showPurchaseButton?: boolean;
}

export default function CreditBalance({ className = '', showPurchaseButton = true }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadBalance();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        loadBalance();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBalance(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit balance:', error);
      }
      
      setBalance(data?.current_balance || 0);
    } catch (error) {
      console.error('Error loading credit balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if user is not logged in
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
        <Coins className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {balance || 0}
        </span>
      </div>
      
      {showPurchaseButton && balance < 10 && (
        <Link href="/profile?tab=credits">
          <Button size="sm" variant="outline" className="h-8 px-2">
            <Plus className="w-3 h-3 mr-1" />
            Buy
          </Button>
        </Link>
      )}
    </div>
  );
}

// Refresh function that can be called from other components
export const refreshCreditBalance = () => {
  window.dispatchEvent(new CustomEvent('refresh-credit-balance'));
};