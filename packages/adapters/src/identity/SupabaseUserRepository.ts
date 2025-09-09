import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@preset/domain/identity/entities/User';
import { UserRepository } from '@preset/domain/identity/ports/UserRepository';
import { Email } from '@preset/domain/identity/value-objects/Email';
import { VerificationStatus } from '@preset/domain/identity/value-objects/VerificationStatus';
import { UserRole } from '@preset/domain/identity/value-objects/UserRole';
import { SubscriptionTier } from '@preset/domain/subscriptions/SubscriptionTier';

/**
 * Supabase implementation of UserRepository
 */
export class SupabaseUserRepository implements UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .in('id', ids);

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async emailExists(email: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.toLowerCase());

    if (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async save(user: User): Promise<void> {
    const data = user.toPersistence();
    
    const { error } = await this.supabase
      .from('users')
      .upsert(data, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async countBySubscriptionTier(tier: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_tier', tier);

    if (error) {
      throw new Error(`Failed to count users by tier: ${error.message}`);
    }

    return count ?? 0;
  }

  async findExpiredSubscriptions(date: Date): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', date.toISOString());

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async findExpiredSuspensions(date: Date): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('is_suspended', true)
      .not('suspended_until', 'is', null)
      .lt('suspended_until', date.toISOString());

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: any): User {
    // Parse verification status
    let verificationStatus: VerificationStatus;
    if (row.verification_status) {
      const status = row.verification_status;
      switch (status.level) {
        case 'email_verified':
          verificationStatus = VerificationStatus.emailVerified(new Date(status.verifiedAt));
          break;
        case 'phone_verified':
          verificationStatus = VerificationStatus.phoneVerified(new Date(status.verifiedAt));
          break;
        case 'id_verified':
          verificationStatus = VerificationStatus.idVerified(
            new Date(status.verifiedAt),
            status.verificationMethod
          );
          break;
        default:
          verificationStatus = VerificationStatus.unverified();
      }
    } else {
      verificationStatus = VerificationStatus.unverified();
    }

    return User.fromPersistence({
      id: row.id,
      email: new Email(row.email),
      role: row.role as UserRole,
      verificationStatus,
      subscriptionTier: (row.subscription_tier || 'free') as SubscriptionTier,
      subscriptionExpiresAt: row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
      isActive: row.is_active ?? true,
      isSuspended: row.is_suspended ?? false,
      suspendedUntil: row.suspended_until ? new Date(row.suspended_until) : undefined,
      suspensionReason: row.suspension_reason,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}