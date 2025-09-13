import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { Email } from '../value-objects/Email';
import { UserRole } from '../value-objects/UserRole';
import { VerificationStatus } from '../value-objects/VerificationStatus';
import { SubscriptionTier } from '../../subscriptions/SubscriptionTier';
import { UserRegistered, UserVerified, UserRoleChanged, SubscriptionChanged } from '../events/UserEvents';

export interface UserProps {
  id: string;
  email: Email;
  role: UserRole;
  verificationStatus: VerificationStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  isActive: boolean;
  isSuspended: boolean;
  suspendedUntil?: Date;
  suspensionReason?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User aggregate root - manages authentication and authorization
 */
export class User extends BaseAggregateRoot {
  private constructor(private props: UserProps) {
    super();
  }

  /**
   * Create a new user
   */
  static create(params: {
    email: string;
    role: UserRole;
  }): User {
    const email = new Email(params.email);
    
    const user = new User({
      id: crypto.randomUUID(),
      email,
      role: params.role,
      verificationStatus: VerificationStatus.unverified(),
      subscriptionTier: SubscriptionTier.FREE,
      isActive: true,
      isSuspended: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Emit domain event
    user.raise(new UserRegistered(
      user.id,
      {
        userId: user.id,
        email: email.toString(),
        role: params.role
      }
    ));

    return user;
  }

  /**
   * Reconstitute user from persistence
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get email(): Email { return this.props.email; }
  get role(): UserRole { return this.props.role; }
  get verificationStatus(): VerificationStatus { return this.props.verificationStatus; }
  get subscriptionTier(): SubscriptionTier { return this.props.subscriptionTier; }
  get isActive(): boolean { return this.props.isActive; }
  get isSuspended(): boolean { return this.props.isSuspended; }
  get createdAt(): Date { return this.props.createdAt; }

  // Additional getter methods needed by application layer
  getEmail(): string { return this.props.email.toString(); }
  getSubscriptionTier(): SubscriptionTier { return this.props.subscriptionTier; }

  /**
   * Verify user's email
   */
  verifyEmail(): void {
    if (this.props.verificationStatus.isEmailVerified()) {
      throw new Error('Email already verified');
    }

    this.props.verificationStatus = VerificationStatus.emailVerified();
    this.props.updatedAt = new Date();

    this.raise(new UserVerified(
      this.id,
      {
        userId: this.id,
        verificationType: 'email'
      }
    ));
  }

  /**
   * Verify user's phone
   */
  verifyPhone(): void {
    if (!this.props.verificationStatus.isEmailVerified()) {
      throw new Error('Email must be verified first');
    }

    this.props.verificationStatus = VerificationStatus.phoneVerified();
    this.props.updatedAt = new Date();

    this.raise(new UserVerified(
      this.id,
      {
        userId: this.id,
        verificationType: 'phone'
      }
    ));
  }

  /**
   * Verify user's ID
   */
  verifyId(method: string = 'manual'): void {
    if (!this.props.verificationStatus.isPhoneVerified()) {
      throw new Error('Phone must be verified first');
    }

    this.props.verificationStatus = VerificationStatus.idVerified(new Date(), method);
    this.props.updatedAt = new Date();

    this.raise(new UserVerified(
      this.id,
      {
        userId: this.id,
        verificationType: 'id'
      }
    ));
  }

  /**
   * Change user role
   */
  changeRole(newRole: UserRole): void {
    if (this.props.role === newRole) {
      return;
    }

    const oldRole = this.props.role;
    this.props.role = newRole;
    this.props.updatedAt = new Date();

    this.raise(new UserRoleChanged(
      this.id,
      {
        userId: this.id,
        oldRole,
        newRole
      }
    ));
  }

  /**
   * Update subscription
   */
  updateSubscription(tier: SubscriptionTier, expiresAt?: Date): void {
    const oldTier = this.props.subscriptionTier;
    
    this.props.subscriptionTier = tier;
    this.props.subscriptionExpiresAt = expiresAt;
    this.props.updatedAt = new Date();

    this.raise(new SubscriptionChanged(
      this.id,
      {
        userId: this.id,
        oldTier,
        newTier: tier,
        expiresAt: expiresAt?.toISOString()
      }
    ));
  }

  /**
   * Suspend user
   */
  suspend(reason: string, until?: Date): void {
    if (this.props.isSuspended) {
      throw new Error('User is already suspended');
    }

    this.props.isSuspended = true;
    this.props.suspendedUntil = until;
    this.props.suspensionReason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * Unsuspend user
   */
  unsuspend(): void {
    if (!this.props.isSuspended) {
      throw new Error('User is not suspended');
    }

    this.props.isSuspended = false;
    this.props.suspendedUntil = undefined;
    this.props.suspensionReason = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if suspension has expired
   */
  checkSuspensionExpired(): boolean {
    if (!this.props.isSuspended || !this.props.suspendedUntil) {
      return false;
    }

    const expired = new Date() > this.props.suspendedUntil;
    if (expired) {
      this.unsuspend();
    }

    return expired;
  }

  /**
   * Record login
   */
  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if user can perform an action
   */
  canPerform(permission: string): boolean {
    if (!this.props.isActive || this.props.isSuspended) {
      return false;
    }

    // Check role permissions
    const rolePermissions = RolePermissions[this.props.role];
    return rolePermissions?.includes(permission) || false;
  }

  /**
   * Convert to persistence model
   */
  toPersistence() {
    return {
      id: this.props.id,
      email: this.props.email.toString(),
      role: this.props.role,
      verification_status: this.props.verificationStatus.toJSON(),
      subscription_tier: this.props.subscriptionTier,
      subscription_expires_at: this.props.subscriptionExpiresAt?.toISOString(),
      is_active: this.props.isActive,
      is_suspended: this.props.isSuspended,
      suspended_until: this.props.suspendedUntil?.toISOString(),
      suspension_reason: this.props.suspensionReason,
      last_login_at: this.props.lastLoginAt?.toISOString(),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }
}

import { RolePermissions } from '../value-objects/UserRole';