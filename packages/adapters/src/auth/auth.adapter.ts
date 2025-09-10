import { AuthService } from '@preset/application';
import { User, UserId, Email, Handle, UserRole } from '@preset/domain';
import { SupabaseClient, Session, AuthError } from '@supabase/supabase-js';
import { Database } from '../database/database.types';

export interface AuthResult {
  user: User;
  session: Session;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  handle: string;
  role: UserRole;
}

export interface SignInData {
  email: string;
  password: string;
}

export class SupabaseAuthService implements AuthService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Check if handle is already taken
      const { data: existingHandle } = await this.supabase
        .from('users_profile')
        .select('id')
        .eq('handle', data.handle)
        .single();

      if (existingHandle) {
        throw new Error('Handle already taken');
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            handle: data.handle,
            role: data.role,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user || !authData.session) {
        throw new Error('Failed to create user account');
      }

      // Create user profile
      const { error: profileError } = await this.supabase
        .from('users_profile')
        .insert({
          user_id: authData.user.id,
          display_name: data.displayName,
          handle: data.handle,
          role: data.role as any,
          subscription_tier: 'free' as any,
          subscription_status: 'active' as any,
          verification_status: 'unverified' as any,
          style_tags: [],
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Create domain user
      const user = User.create({
        id: new UserId(authData.user.id),
        email: new Email(data.email),
        role: data.role,
        displayName: data.displayName,
        handle: new Handle(data.handle),
      });

      return {
        user,
        session: authData.session,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      if (!authData.user || !authData.session) {
        throw new Error('Invalid credentials');
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      // Create domain user
      const user = User.create({
        id: new UserId(authData.user.id),
        email: new Email(data.email),
        role: profile.role as UserRole,
        displayName: profile.display_name,
        handle: new Handle(profile.handle),
      });

      return {
        user,
        session: authData.session,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Get user profile
      const { data: profile, error } = await this.supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        return null;
      }

      return User.create({
        id: new UserId(user.id),
        email: new Email(user.email!),
        role: profile.role as UserRole,
        displayName: profile.display_name,
        handle: new Handle(profile.handle),
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  async refreshSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.supabase.auth.refreshSession();
    
    if (error) {
      throw error;
    }

    return session;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({
      type: 'email',
      token,
      email: '', // Email will be extracted from token
    });

    if (error) {
      throw error;
    }

    // Update verification status
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      await this.supabase
        .from('users_profile')
        .update({ verification_status: 'email_verified' as any })
        .eq('user_id', user.id);
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw error;
    }
  }

  async updateEmail(newEmail: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    // Soft delete user data first
    await this.supabase
      .from('users_profile')
      .update({ 
        deleted_at: new Date().toISOString(),
        email: `deleted_${userId}@deleted.com`,
        handle: `deleted_${userId}`,
      })
      .eq('user_id', userId);

    // Then delete auth account
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw error;
    }
  }

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    // Get user profile with role
    const { data: profile } = await this.supabase
      .from('users_profile')
      .select('role, subscription_tier')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return false;
    }

    // Admin has all permissions
    if (profile.role === 'admin') {
      return true;
    }

    // Check role-based permissions
    const permissions = this.getRolePermissions(profile.role as UserRole);
    const permission = `${resource}:${action}`;

    return permissions.includes(permission);
  }

  private getRolePermissions(role: UserRole): string[] {
    const basePermissions = [
      'profile:read',
      'profile:update_own',
      'gig:read',
      'showcase:read',
      'message:read_own',
      'message:create',
    ];

    switch (role) {
      case UserRole.CONTRIBUTOR:
        return [
          ...basePermissions,
          'gig:create',
          'gig:update_own',
          'gig:delete_own',
          'application:read_received',
          'application:update_received',
          'showcase:create',
          'showcase:update_own',
          'moodboard:create',
          'moodboard:update_own',
        ];

      case UserRole.TALENT:
        return [
          ...basePermissions,
          'application:create',
          'application:read_own',
          'application:update_own',
          'showcase:approve',
        ];

      case UserRole.ADMIN:
        return ['*:*']; // All permissions

      default:
        return basePermissions;
    }
  }

  async setupMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const { data, error } = await this.supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      throw error;
    }

    return {
      secret: data.totp.secret,
      qrCode: data.totp.qr_code,
    };
  }

  async verifyMFA(code: string): Promise<void> {
    const { data: factors } = await this.supabase.auth.mfa.listFactors();
    
    if (!factors || factors.totp.length === 0) {
      throw new Error('MFA not set up');
    }

    const { error } = await this.supabase.auth.mfa.verify({
      factorId: factors.totp[0].id,
      code,
    });

    if (error) {
      throw error;
    }
  }

  async disableMFA(userId: string): Promise<void> {
    const { data: factors } = await this.supabase.auth.mfa.listFactors();
    
    if (!factors || factors.totp.length === 0) {
      return;
    }

    const { error } = await this.supabase.auth.mfa.unenroll({
      factorId: factors.totp[0].id,
    });

    if (error) {
      throw error;
    }
  }

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }
}