'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CreditCard, 
  Coins, 
  History, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface UserCredits {
  balance: number;
  lifetime_earned: number;
  lifetime_consumed: number;
  last_purchase_at: string | null;
  last_consumed_at: string | null;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

interface CreditPurchase {
  id: string;
  package_id: string;
  credits_purchased: number;
  amount_paid_usd: number;
  payment_method: string;
  status: string;
  stripe_session_id: string | null;
  completed_at: string | null;
  created_at: string;
}

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price_usd: number;
  is_popular: boolean;
}

export default function CreditsDashboard() {
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'purchase'>('overview');

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setUserCredits(creditsData);

      // Load recent transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);

      // Load purchase history
      const { data: purchasesData } = await supabase
        .from('user_credit_purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setPurchases(purchasesData || []);

      // Load available packages
      const { data: packagesData } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      setPackages(packagesData || []);

    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call the create checkout session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/profile?tab=credits&success=true`,
          cancelUrl: `${window.location.origin}/profile?tab=credits&cancelled=true`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }

    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'consume': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'refund': return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case 'bonus': return <Coins className="w-4 h-4 text-purple-600" />;
      default: return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Balance Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-900">
                {userCredits?.balance || 0} <span className="text-lg font-normal">credits</span>
              </div>
              <p className="text-blue-700 mt-1">Available for image enhancements</p>
            </div>
            <Button
              onClick={() => setActiveTab('purchase')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold">{userCredits?.lifetime_earned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <History className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Used</p>
                <p className="text-2xl font-bold">{userCredits?.lifetime_consumed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Purchase</p>
                <p className="text-sm font-bold">
                  {userCredits?.last_purchase_at 
                    ? format(new Date(userCredits.last_purchase_at), 'MMM d, yyyy')
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'history', label: 'Transaction History', icon: History },
          { id: 'purchase', label: 'Buy Credits', icon: ShoppingCart },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No purchases yet</p>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium">{purchase.package_id} Package</p>
                        <p className="text-sm text-gray-500">
                          {purchase.credits_purchased} credits • ${purchase.amount_paid_usd}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(purchase.created_at), 'MMM d, yyyy at h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(purchase.status)}
                        {purchase.stripe_session_id && (
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          {transaction.reference_id && (
                            <p className="text-xs text-gray-400">Ref: {transaction.reference_id}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: {transaction.balance_after}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'purchase' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Credit Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className={`relative ${pkg.is_popular ? 'ring-2 ring-blue-500' : ''}`}>
                    {pkg.is_popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                        Popular
                      </Badge>
                    )}
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-bold mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {pkg.credits}
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                      <div className="text-2xl font-bold mb-4">${pkg.price_usd}</div>
                      <Button
                        onClick={() => handlePurchaseCredits(pkg.id)}
                        disabled={purchasing === pkg.id}
                        className="w-full"
                      >
                        {purchasing === pkg.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}