'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
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
  const { user, loading: authLoading } = useAuth();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'purchase'>('overview');

  useEffect(() => {
    if (!authLoading && user) {
      loadCreditData();
    }
  }, [user, authLoading]);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('❌ No user found - user not authenticated');
        return;
      }

      console.log('✅ User found:', {
        userId: user.id,
        email: user.email
      });

      // Load user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creditsError) {
        console.error('Error loading user credits:', creditsError);
      } else {
        console.log('User credits loaded:', creditsData);
        setUserCredits(creditsData);
      }

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
      } else {
        console.log('Transactions loaded:', transactionsData);
        setTransactions(transactionsData || []);
      }

      // Load purchase history
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (purchasesError) {
        console.error('Error loading purchases:', purchasesError);
      } else {
        console.log('Purchases loaded:', purchasesData);
        setPurchases(purchasesData || []);
      }

      // Load available packages
      console.log('🔍 Fetching packages from credit_packages table...');
      const { data: packagesData, error: packagesError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (packagesError) {
        console.error('❌ Error loading packages:', packagesError);
        console.error('Error details:', {
          message: packagesError.message,
          details: packagesError.details,
          hint: packagesError.hint,
          code: packagesError.code
        });
      } else {
        console.log('✅ Packages loaded successfully:', packagesData);
        console.log('📦 Number of packages found:', packagesData?.length || 0);
        setPackages(packagesData || []);
      }

    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      
      if (!user) {
        console.log('❌ No user found for purchase');
        return;
      }

      console.log('🛒 Starting purchase for package:', packageId);

      // Get session for the API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session found for purchase');
        return;
      }

      console.log('✅ Session found, calling Stripe API...');

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
      console.log('📦 Stripe API response:', data);

      if (data.url) {
        console.log('✅ Redirecting to Stripe Checkout...');
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }

    } catch (error) {
      console.error('❌ Error purchasing credits:', error);
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

  if (authLoading || loading) {
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('purchase')}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Coins className="w-8 h-8 text-emerald-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Credit Balance</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-700">{userCredits?.balance || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Available credits</p>
              </div>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('purchase');
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{userCredits?.lifetime_earned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <History className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Used</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{userCredits?.lifetime_consumed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Last Purchase</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {userCredits?.last_purchase_at 
                    ? format(new Date(userCredits.last_purchase_at), 'MMM d')
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
        <div className="space-y-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    Choose a Credit Package
                  </CardTitle>
                  <p className="text-gray-600 font-medium">Select the perfect package for your creative needs</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCreditData}
                  disabled={loading}
                  className="border-gray-300 hover:bg-white hover:border-gray-400 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {packages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Packages Available</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">We're currently updating our credit packages. Please check back soon or contact support for assistance.</p>
                  <div className="text-xs text-gray-400 mb-6 bg-gray-50 px-4 py-2 rounded-lg inline-block">
                    Debug: packages.length = {packages.length}, loading = {loading.toString()}
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadCreditData}
                    disabled={loading}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className={`relative group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${pkg.is_popular ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-2 hover:ring-gray-200 shadow-md'}`}>
                      {pkg.is_popular && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 shadow-lg">
                          MOST POPULAR
                        </Badge>
                      )}
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{pkg.name}</h3>
                          <div className="relative">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                              {pkg.credits}
                            </div>
                            <p className="text-sm text-gray-500 font-medium">credits</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 text-center leading-relaxed">{pkg.description}</p>
                        </div>

                        {/* Price */}
                        <div className="text-center mb-6">
                          <div className="text-2xl font-bold text-gray-900 mb-1">${pkg.price_usd}</div>
                          <p className="text-xs text-gray-400">one-time payment</p>
                        </div>

                        {/* Button */}
                        <Button
                          onClick={() => handlePurchaseCredits(pkg.id)}
                          disabled={purchasing === pkg.id}
                          className={`w-full h-11 font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                            pkg.is_popular 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                          }`}
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
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}