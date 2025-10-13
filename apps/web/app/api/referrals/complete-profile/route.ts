import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/referrals/complete-profile
 * Called when a user completes their profile
 * Awards credits to the referrer if user was invited
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, invited_by_code, profile_completed_at, invite_code')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if profile was already marked as completed
    if (profile.profile_completed_at) {
      return NextResponse.json({
        success: true,
        message: 'Profile already completed',
        alreadyCompleted: true
      });
    }

    // Mark profile as completed
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({
        profile_completed_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile completion:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark profile as completed' },
        { status: 500 }
      );
    }

    // If user was invited, award credits to referrer
    let creditsAwarded = false;
    let referrerProfile = null;

    if (profile.invited_by_code) {
      try {
        // Find the invite code and referrer
        const { data: inviteCodeData, error: codeError } = await supabase
          .from('invite_codes')
          .select('id, created_by_user_id')
          .eq('code', profile.invited_by_code)
          .single();

        if (!codeError && inviteCodeData && inviteCodeData.created_by_user_id) {
          // Get referrer profile
          const { data: referrer } = await supabase
            .from('users_profile')
            .select('id, user_id, display_name')
            .eq('id', inviteCodeData.created_by_user_id)
            .single();

          if (referrer) {
            referrerProfile = referrer;

            // Create referral credit record
            const { data: referralCredit, error: creditError } = await supabase
              .from('referral_credits')
              .insert({
                referrer_user_id: referrer.id,
                referred_user_id: profile.id,
                invite_code_id: inviteCodeData.id,
                credits_awarded: 5,
                status: 'awarded',
                awarded_at: new Date().toISOString()
              })
              .select()
              .single();

            if (creditError) {
              console.error('Error creating referral credit:', creditError);
            } else {
              creditsAwarded = true;

              // Increment referrer's total_referrals count
              const { data: currentProfile } = await supabase
                .from('users_profile')
                .select('total_referrals')
                .eq('id', referrer.id)
                .single();

              await supabase
                .from('users_profile')
                .update({
                  total_referrals: (currentProfile?.total_referrals || 0) + 1
                })
                .eq('id', referrer.id);

              // Award 5 credits to referrer using direct database update
              try {
                // First, get current balance to ensure user_credits record exists
                const { data: referrerCredits } = await supabase
                  .from('user_credits')
                  .select('current_balance')
                  .eq('user_id', referrer.user_id)
                  .single();

                if (!referrerCredits) {
                  console.error('Referrer has no credit record, creating one...');
                  // Create credit record if it doesn't exist
                  await supabase.from('user_credits').insert({
                    user_id: referrer.user_id,
                    subscription_tier: 'free',
                    current_balance: 5,
                    monthly_allowance: 0,
                    consumed_this_month: 0
                  });
                } else {
                  // Update referrer's credits
                  const { error: creditError } = await supabase
                    .from('user_credits')
                    .update({
                      current_balance: referrerCredits.current_balance + 5,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', referrer.user_id);

                  if (creditError) {
                    console.error('Error updating referrer credits:', creditError);

                    // Rollback referral_credits entry on failure
                    await supabase
                      .from('referral_credits')
                      .delete()
                      .eq('id', referralCredit.id);

                    throw new Error('Failed to award referral credits');
                  }
                }

                // Log transaction
                await supabase.from('credit_transactions').insert({
                  user_id: referrer.user_id,
                  transaction_type: 'referral_bonus',
                  credits_used: 5,
                  status: 'completed',
                  metadata: {
                    referred_user_id: profile.id,
                    referral_credit_id: referralCredit.id
                  }
                });

                console.log('Referral credits awarded successfully');
              } catch (creditAddError) {
                console.error('Error adding credits:', creditAddError);
                // Don't throw - we've already created the referral_credits record
                // Continue with profile completion
              }

              // Send email notification to referrer
              try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
                await fetch(`${appUrl}/api/emails/referral-success`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    referrerEmail: referrer.user_id,
                    referrerName: referrer.display_name,
                    creditsEarned: 5
                  })
                });
              } catch (emailError) {
                console.error('Error sending referral email:', emailError);
                // Continue anyway
              }
            }
          }
        }
      } catch (referralError) {
        console.error('Error processing referral:', referralError);
        // Don't block profile completion on referral error
      }
    }

    // Generate invite code for new user if they don't have one
    if (!profile.invite_code) {
      try {
        const { data: newCode } = await supabase.rpc('generate_invite_code');

        if (newCode) {
          await supabase
            .from('users_profile')
            .update({ invite_code: newCode })
            .eq('id', profile.id);

          await supabase
            .from('invite_codes')
            .insert({
              code: newCode,
              created_by_user_id: profile.id,
              status: 'active'
            });
        }
      } catch (codeGenError) {
        console.error('Error generating invite code:', codeGenError);
        // Don't block on this error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      creditsAwarded,
      referrer: creditsAwarded ? {
        displayName: referrerProfile?.display_name
      } : null
    });

  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
