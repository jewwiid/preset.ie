/**
 * User verification levels
 */
export enum VerificationLevel {
  NONE = 'none',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  ID_VERIFIED = 'id_verified'
}

/**
 * Verification status value object
 */
export class VerificationStatus {
  constructor(
    private readonly level: VerificationLevel,
    private readonly verifiedAt?: Date,
    private readonly verificationMethod?: string
  ) {}

  static unverified(): VerificationStatus {
    return new VerificationStatus(VerificationLevel.NONE);
  }

  static emailVerified(verifiedAt: Date = new Date()): VerificationStatus {
    return new VerificationStatus(VerificationLevel.EMAIL_VERIFIED, verifiedAt, 'email');
  }

  static phoneVerified(verifiedAt: Date = new Date()): VerificationStatus {
    return new VerificationStatus(VerificationLevel.PHONE_VERIFIED, verifiedAt, 'sms');
  }

  static idVerified(verifiedAt: Date = new Date(), method: string = 'manual'): VerificationStatus {
    return new VerificationStatus(VerificationLevel.ID_VERIFIED, verifiedAt, method);
  }

  isVerified(): boolean {
    return this.level !== VerificationLevel.NONE;
  }

  isEmailVerified(): boolean {
    return this.level === VerificationLevel.EMAIL_VERIFIED || 
           this.level === VerificationLevel.PHONE_VERIFIED ||
           this.level === VerificationLevel.ID_VERIFIED;
  }

  isPhoneVerified(): boolean {
    return this.level === VerificationLevel.PHONE_VERIFIED ||
           this.level === VerificationLevel.ID_VERIFIED;
  }

  isIdVerified(): boolean {
    return this.level === VerificationLevel.ID_VERIFIED;
  }

  getLevel(): VerificationLevel {
    return this.level;
  }

  getVerifiedAt(): Date | undefined {
    return this.verifiedAt;
  }

  canUpgradeTo(newLevel: VerificationLevel): boolean {
    const levelOrder = [
      VerificationLevel.NONE,
      VerificationLevel.EMAIL_VERIFIED,
      VerificationLevel.PHONE_VERIFIED,
      VerificationLevel.ID_VERIFIED
    ];
    
    const currentIndex = levelOrder.indexOf(this.level);
    const newIndex = levelOrder.indexOf(newLevel);
    
    return newIndex > currentIndex;
  }

  toJSON() {
    return {
      level: this.level,
      verifiedAt: this.verifiedAt?.toISOString(),
      verificationMethod: this.verificationMethod
    };
  }
}