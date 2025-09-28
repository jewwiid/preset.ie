'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAdmin() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestAdmin = async () => {
    setLoading(true);
    setStatus('Creating admin account...');
    
    try {
      // Try to sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@preset.ie',
        password: 'Admin123!@#'
      });

      if (signUpError) {
        setStatus(`Sign up error: ${signUpError.message}`);
        
        // If user exists, try to sign in
        if (signUpError.message.includes('already')) {
          setStatus('User exists, trying to sign in...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@preset.ie',
            password: 'Admin123!@#'
          });

          if (signInError) {
            setStatus(`Sign in error: ${signInError.message}`);
            return;
          }

          if (signInData.user) {
            setStatus('✅ Signed in successfully! User ID: ' + signInData.user.id);
            await createOrUpdateProfile(signInData.user.id);
          }
        }
        return;
      }

      if (signUpData.user) {
        setStatus('✅ Admin user created! User ID: ' + signUpData.user.id);
        await createOrUpdateProfile(signUpData.user.id);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProfile = async (userId: string) => {
    setStatus(prev => prev + '\nCreating/updating profile...');
    
    const { data: existingProfile } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      const { error } = await supabase
        .from('users_profile')
        .update({
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          display_name: 'Admin User',
          bio: 'Platform Administrator',
          city: 'Dublin',
          subscription_tier: 'PRO'
        })
        .eq('user_id', userId);

      if (error) {
        setStatus(prev => prev + `\n❌ Profile update error: ${error.message}`);
      } else {
        setStatus(prev => prev + '\n✅ Profile updated with admin role!');
      }
    } else {
      const { error } = await supabase
        .from('users_profile')
        .insert({
          user_id: userId,
          display_name: 'Admin User',
          handle: `admin_${Date.now()}`, // Unique handle
          bio: 'Platform Administrator',
          city: 'Dublin',
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          style_tags: [],
          subscription_tier: 'PRO'
        });

      if (error) {
        setStatus(prev => prev + `\n❌ Profile creation error: ${error.message}`);
      } else {
        setStatus(prev => prev + '\n✅ Profile created with admin role!');
      }
    }
  };

  const testSignIn = async () => {
    console.log('Test sign in clicked');
    setLoading(true);
    setStatus('Testing sign in...');
    
    try {
      console.log('Attempting sign in with:', { email: 'admin@preset.ie', password: 'Admin123!@#' });
      
      // First check current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setStatus('Already signed in! Signing out first...');
        await supabase.auth.signOut();
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@preset.ie',
        password: 'Admin123!@#'
      });

      console.log('Sign in response:', { data, error });

      if (error) {
        console.error('Sign in error:', error);
        setStatus(`❌ Sign in failed: ${error.message}\n\nTry creating the account first with button 1, or reset the password with button 3.`);
      } else if (data.user) {
        setStatus(`✅ Sign in successful!\nUser ID: ${data.user.id}\nEmail: ${data.user.email}`);
        
        // Check profile
        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (profile) {
          setStatus(prev => prev + `\n\nProfile found:\n- Display Name: ${profile.display_name}\n- Handle: ${profile.handle}\n- Roles: ${profile.role_flags?.join(', ')}\n- Subscription: ${profile.subscription_tier}`);
          
          // If admin role exists, show admin panel link
          if (profile.role_flags?.includes('ADMIN')) {
            setStatus(prev => prev + '\n\n✅ Admin role confirmed! You can access the admin panel.');
          }
        } else {
          setStatus(prev => prev + '\n\n⚠️ No profile found for this user. Click button 1 to create profile.');
        }
      } else {
        setStatus('No user data returned from sign in');
      }
    } catch (error: any) {
      console.error('Caught error:', error);
      setStatus(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setStatus('Creating new admin account with correct password...');
    
    try {
      // First, sign out any existing session
      await supabase.auth.signOut();
      
      // Try to create a new account with a different email
      const testEmail = `admin_${Date.now()}@preset.ie`;
      const testPassword = 'Admin123!@#';
      
      setStatus(`Creating account: ${testEmail}`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (signUpError) {
        setStatus(`❌ Failed: ${signUpError.message}`);
      } else if (signUpData.user) {
        setStatus(`✅ New admin account created!\n\nEmail: ${testEmail}\nPassword: ${testPassword}\nUser ID: ${signUpData.user.id}`);
        
        // Create admin profile
        const { error: profileError } = await supabase
          .from('users_profile')
          .insert({
            user_id: signUpData.user.id,
            display_name: 'Admin User',
            handle: `admin_${Date.now()}`,
            bio: 'Platform Administrator',
            city: 'Dublin',
            role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
            style_tags: [],
            subscription_tier: 'PRO'
          });
          
        if (profileError) {
          setStatus(prev => prev + `\n\n⚠️ Profile error: ${profileError.message}`);
        } else {
          setStatus(prev => prev + '\n\n✅ Admin profile created! You can now sign in with the credentials above.');
        }
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Account Test</h1>
        
        <div className="bg-background rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Admin Credentials:</h2>
          <p className="font-mono bg-muted-100 p-2 rounded mb-2">Email: admin@preset.ie</p>
          <p className="font-mono bg-muted-100 p-2 rounded">Password: Admin123!@#</p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={createTestAdmin}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : '1. Create/Update Admin Account'}
          </button>

          <button
            onClick={testSignIn}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : '2. Test Sign In'}
          </button>

          <button
            onClick={resetPassword}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : '3. Create New Admin Account (Fresh)'}
          </button>
        </div>

        {status && (
          <div className="mt-6 bg-muted-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Status:</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm">{status}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-primary-50 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create/Update Admin Account" first</li>
            <li>Then click "Test Sign In" to verify it works</li>
            <li>If sign in fails, try "Send Password Reset" to reset the password</li>
            <li>Once working, go to <a href="/auth/signin" className="text-primary-600 underline">/auth/signin</a> to login normally</li>
          </ol>
        </div>
      </div>
    </div>
  );
}