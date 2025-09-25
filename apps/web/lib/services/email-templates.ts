// Comprehensive Email Template System for Preset Platform
// Uses Preset brand colors, fonts, and design system

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

// Base email template with Preset branding
export class PresetEmailTemplates {
  private static readonly BRAND_COLORS = {
    primary: '#00876f',
    secondary: '#2dd4bf',
    light: '#ccfbef',
    dark: '#134e48',
    white: '#ffffff',
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  };

  private static readonly BASE_STYLES = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: ${this.BRAND_COLORS.gray[800]};
        background-color: ${this.BRAND_COLORS.gray[50]};
        margin: 0;
        padding: 0;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${this.BRAND_COLORS.white};
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, ${this.BRAND_COLORS.primary} 0%, ${this.BRAND_COLORS.secondary} 100%);
        padding: 32px 24px;
        text-align: center;
        color: ${this.BRAND_COLORS.white};
      }
      
      .email-header h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.025em;
      }
      
      .email-header .subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin-top: 8px;
        font-weight: 400;
      }
      
      .email-content {
        padding: 32px 24px;
      }
      
      .email-content h2 {
        font-size: 24px;
        font-weight: 600;
        color: ${this.BRAND_COLORS.gray[900]};
        margin-bottom: 16px;
        letter-spacing: -0.025em;
      }
      
      .email-content p {
        font-size: 16px;
        color: ${this.BRAND_COLORS.gray[600]};
        margin-bottom: 16px;
        line-height: 1.6;
      }
      
      .email-content .highlight {
        background-color: ${this.BRAND_COLORS.light};
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid ${this.BRAND_COLORS.primary};
        margin: 20px 0;
      }
      
      .email-content .highlight strong {
        color: ${this.BRAND_COLORS.gray[900]};
        font-weight: 600;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, ${this.BRAND_COLORS.primary} 0%, ${this.BRAND_COLORS.secondary} 100%);
        color: ${this.BRAND_COLORS.white};
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        margin: 24px 0;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 135, 111, 0.2);
      }
      
      .cta-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 135, 111, 0.3);
      }
      
      .email-footer {
        background-color: ${this.BRAND_COLORS.gray[50]};
        padding: 24px;
        border-top: 1px solid ${this.BRAND_COLORS.gray[200]};
        text-align: center;
      }
      
      .email-footer p {
        font-size: 14px;
        color: ${this.BRAND_COLORS.gray[500]};
        margin-bottom: 8px;
      }
      
      .email-footer a {
        color: ${this.BRAND_COLORS.primary};
        text-decoration: none;
      }
      
      .email-footer a:hover {
        text-decoration: underline;
      }
      
      .social-links {
        margin-top: 16px;
      }
      
      .social-links a {
        display: inline-block;
        margin: 0 8px;
        color: ${this.BRAND_COLORS.gray[500]};
        text-decoration: none;
        font-size: 14px;
      }
      
      .social-links a:hover {
        color: ${this.BRAND_COLORS.primary};
      }
      
      @media (max-width: 600px) {
        .email-container {
          margin: 0;
          border-radius: 0;
        }
        
        .email-header,
        .email-content,
        .email-footer {
          padding: 24px 16px;
        }
        
        .email-header h1 {
          font-size: 24px;
        }
        
        .email-content h2 {
          font-size: 20px;
        }
        
        .cta-button {
          display: block;
          text-align: center;
          margin: 20px 0;
        }
      }
    </style>
  `;

  private static generateBaseTemplate(
    title: string,
    subtitle: string,
    content: string,
    ctaText?: string,
    ctaUrl?: string,
    footerText?: string
  ): string {
    const ctaButton = ctaText && ctaUrl ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - Preset</title>
          ${this.BASE_STYLES}
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>${title}</h1>
              <div class="subtitle">${subtitle}</div>
            </div>
            
            <div class="email-content">
              ${content}
              ${ctaButton}
            </div>
            
            <div class="email-footer">
              <p><strong>Preset Platform</strong></p>
              <p>${footerText || 'Connecting creatives worldwide'}</p>
              <div class="social-links">
                <a href="https://presetie.com">Website</a>
                <a href="https://presetie.com/support">Support</a>
                <a href="https://presetie.com/privacy">Privacy</a>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: ${this.BRAND_COLORS.gray[400]};">
                You're receiving this email because you're a member of Preset Platform.
                <a href="https://presetie.com/settings/notifications">Manage your preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ===== PHASE 1: CORE FUNCTIONALITY TEMPLATES =====

  // 1. Welcome Email Series
  static generateWelcomeEmail(userName: string, actionUrl: string): EmailTemplate {
    const subject = `Welcome to Preset, ${userName}! 🎬`;
    
    const content = `
      <h2>Welcome to the Preset Community!</h2>
      <p>Hi ${userName},</p>
      
      <p>We're thrilled to have you join Preset, the premier platform connecting creatives worldwide. Whether you're a photographer, videographer, or creative professional, you're now part of a vibrant community that's reshaping how creative collaborations happen.</p>
      
      <div class="highlight">
        <strong>What you can do on Preset:</strong><br>
        🎬 Browse and apply to creative gigs<br>
        🎨 Showcase your work in professional portfolios<br>
        🤝 Connect with like-minded creatives<br>
        💼 Post your own gigs and find talent<br>
        🎪 Access AI-powered creative tools
      </div>
      
      <p>To get started, complete your profile and explore the platform. Your creative journey begins now!</p>
    `;

    const html = this.generateBaseTemplate(
      'Welcome to Preset!',
      'Your creative journey starts here',
      content,
      'Complete Your Profile',
      actionUrl,
      'Ready to create something amazing?'
    );

    const text = `
Welcome to Preset, ${userName}!

We're thrilled to have you join Preset, the premier platform connecting creatives worldwide.

What you can do on Preset:
🎬 Browse and apply to creative gigs
🎨 Showcase your work in professional portfolios  
🤝 Connect with like-minded creatives
💼 Post your own gigs and find talent
🎪 Access AI-powered creative tools

Complete your profile to get started: ${actionUrl}

Welcome to the community!

The Preset Team
    `;

    return { subject, html, text };
  }

  // 2. Email Verification
  static generateEmailVerificationEmail(userName: string, verificationUrl: string): EmailTemplate {
    const subject = 'Verify your Preset account';
    
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Hi ${userName},</p>
      
      <p>Thanks for signing up for Preset! To complete your registration and start using all our features, please verify your email address.</p>
      
      <div class="highlight">
        <strong>Why verify your email?</strong><br>
        ✅ Secure your account<br>
        ✅ Receive important notifications<br>
        ✅ Access all platform features<br>
        ✅ Connect with other creatives
      </div>
      
      <p>Click the button below to verify your email address. This link will expire in 24 hours for security reasons.</p>
    `;

    const html = this.generateBaseTemplate(
      'Verify Your Account',
      'Complete your Preset registration',
      content,
      'Verify Email Address',
      verificationUrl,
      'Secure your account today'
    );

    const text = `
Verify Your Email Address

Hi ${userName},

Thanks for signing up for Preset! To complete your registration, please verify your email address.

Why verify your email?
✅ Secure your account
✅ Receive important notifications  
✅ Access all platform features
✅ Connect with other creatives

Verify your email: ${verificationUrl}

This link expires in 24 hours.

The Preset Team
    `;

    return { subject, html, text };
  }

  // 3. Password Reset
  static generatePasswordResetEmail(userName: string, resetUrl: string): EmailTemplate {
    const subject = 'Reset your Preset password';
    
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      
      <p>We received a request to reset your Preset account password. If you made this request, click the button below to create a new password.</p>
      
      <div class="highlight">
        <strong>Security Notice:</strong><br>
        🔒 This link expires in 1 hour<br>
        🔒 Only use this link once<br>
        🔒 If you didn't request this, ignore this email<br>
        🔒 Your account remains secure
      </div>
      
      <p>If you didn't request a password reset, you can safely ignore this email. Your account is still secure.</p>
    `;

    const html = this.generateBaseTemplate(
      'Password Reset',
      'Secure your account',
      content,
      'Reset Password',
      resetUrl,
      'Keep your account secure'
    );

    const text = `
Password Reset Request

Hi ${userName},

We received a request to reset your Preset account password.

Security Notice:
🔒 This link expires in 1 hour
🔒 Only use this link once
🔒 If you didn't request this, ignore this email
🔒 Your account remains secure

Reset your password: ${resetUrl}

If you didn't request this, ignore this email.

The Preset Team
    `;

    return { subject, html, text };
  }

  // 4. Payment Confirmation
  static generatePaymentConfirmationEmail(
    userName: string,
    amount: string,
    description: string,
    transactionId: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Payment Confirmed - ${description}`;
    
    const content = `
      <h2>Payment Successful! 🎉</h2>
      <p>Hi ${userName},</p>
      
      <p>Your payment has been processed successfully. Here are the details:</p>
      
      <div class="highlight">
        <strong>Transaction Details:</strong><br>
        💳 Amount: ${amount}<br>
        📝 Description: ${description}<br>
        🆔 Transaction ID: ${transactionId}<br>
        ✅ Status: Completed
      </div>
      
      <p>You can view your transaction history and manage your account in your dashboard.</p>
    `;

    const html = this.generateBaseTemplate(
      'Payment Confirmed',
      'Your transaction was successful',
      content,
      'View Transaction',
      actionUrl,
      'Thank you for your business'
    );

    const text = `
Payment Successful!

Hi ${userName},

Your payment has been processed successfully.

Transaction Details:
💳 Amount: ${amount}
📝 Description: ${description}
🆔 Transaction ID: ${transactionId}
✅ Status: Completed

View your transaction: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // 5. Marketplace Transaction Emails
  static generateListingCreatedEmail(
    userName: string,
    listingTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Your listing "${listingTitle}" is now live!`;
    
    const content = `
      <h2>Listing Published Successfully! 🎬</h2>
      <p>Hi ${userName},</p>
      
      <p>Great news! Your equipment listing has been published and is now visible to the Preset community.</p>
      
      <div class="highlight">
        <strong>Listing Details:</strong><br>
        📝 Title: ${listingTitle}<br>
        ✅ Status: Live and visible<br>
        👀 Now discoverable by renters<br>
        💬 Ready to receive inquiries
      </div>
      
      <p>Your listing will appear in search results and can be discovered by creatives looking for equipment. You'll receive notifications when someone shows interest!</p>
    `;

    const html = this.generateBaseTemplate(
      'Listing Live!',
      'Your equipment is now available',
      content,
      'View Your Listing',
      actionUrl,
      'Start earning from your gear'
    );

    const text = `
Listing Published Successfully!

Hi ${userName},

Your equipment listing "${listingTitle}" is now live and visible to the Preset community.

Listing Details:
📝 Title: ${listingTitle}
✅ Status: Live and visible
👀 Now discoverable by renters
💬 Ready to receive inquiries

View your listing: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  static generateNewOfferEmail(
    userName: string,
    offererName: string,
    listingTitle: string,
    offerAmount: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `New offer received for "${listingTitle}"`;
    
    const content = `
      <h2>New Offer Received! 💰</h2>
      <p>Hi ${userName},</p>
      
      <p>Exciting news! You've received a new offer for your equipment listing.</p>
      
      <div class="highlight">
        <strong>Offer Details:</strong><br>
        👤 From: ${offererName}<br>
        📝 Listing: ${listingTitle}<br>
        💰 Offer Amount: ${offerAmount}<br>
        📅 Received: Just now
      </div>
      
      <p>Review the offer details and respond to start the rental process. You can accept, decline, or negotiate the terms.</p>
    `;

    const html = this.generateBaseTemplate(
      'New Offer!',
      'Someone wants to rent your equipment',
      content,
      'Review Offer',
      actionUrl,
      'Turn your gear into income'
    );

    const text = `
New Offer Received!

Hi ${userName},

You've received a new offer for your equipment listing.

Offer Details:
👤 From: ${offererName}
📝 Listing: ${listingTitle}
💰 Offer Amount: ${offerAmount}
📅 Received: Just now

Review the offer: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // ===== PHASE 2: ENGAGEMENT TEMPLATES =====

  // 6. Showcase Engagement
  static generateShowcasePublishedEmail(
    userName: string,
    showcaseTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Your showcase "${showcaseTitle}" is now live!`;
    
    const content = `
      <h2>Showcase Published! 🎨</h2>
      <p>Hi ${userName},</p>
      
      <p>Congratulations! Your showcase has been published and is now visible to the Preset community.</p>
      
      <div class="highlight">
        <strong>Showcase Details:</strong><br>
        🎨 Title: ${showcaseTitle}<br>
        ✅ Status: Published<br>
        👀 Now discoverable by clients<br>
        💼 Showcases your professional work
      </div>
      
      <p>Your showcase will help potential clients discover your talent and style. Share it with your network to increase visibility!</p>
    `;

    const html = this.generateBaseTemplate(
      'Showcase Live!',
      'Your work is now visible',
      content,
      'View Showcase',
      actionUrl,
      'Showcase your creativity'
    );

    const text = `
Showcase Published!

Hi ${userName},

Your showcase "${showcaseTitle}" is now live and visible to the Preset community.

Showcase Details:
🎨 Title: ${showcaseTitle}
✅ Status: Published
👀 Now discoverable by clients
💼 Showcases your professional work

View your showcase: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // 7. Collaboration Updates
  static generateCollaborationInviteEmail(
    userName: string,
    inviterName: string,
    projectTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `${inviterName} invited you to collaborate on "${projectTitle}"`;
    
    const content = `
      <h2>Collaboration Invitation! 🤝</h2>
      <p>Hi ${userName},</p>
      
      <p>Great news! <strong>${inviterName}</strong> has invited you to collaborate on an exciting project.</p>
      
      <div class="highlight">
        <strong>Project Details:</strong><br>
        👤 Invited by: ${inviterName}<br>
        📝 Project: ${projectTitle}<br>
        🤝 Collaboration opportunity<br>
        💼 Professional networking
      </div>
      
      <p>This is a great opportunity to work with talented creatives and expand your portfolio. Review the project details and respond to the invitation.</p>
    `;

    const html = this.generateBaseTemplate(
      'Collaboration Invite',
      'Join a creative project',
      content,
      'View Project',
      actionUrl,
      'Connect and create together'
    );

    const text = `
Collaboration Invitation!

Hi ${userName},

${inviterName} has invited you to collaborate on "${projectTitle}".

Project Details:
👤 Invited by: ${inviterName}
📝 Project: ${projectTitle}
🤝 Collaboration opportunity
💼 Professional networking

View the project: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // 8. Gig Notifications
  static generateGigPostedEmail(
    userName: string,
    gigTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Your gig "${gigTitle}" is now live!`;
    
    const content = `
      <h2>Gig Posted Successfully! 💼</h2>
      <p>Hi ${userName},</p>
      
      <p>Excellent! Your gig has been published and is now visible to talented creatives on Preset.</p>
      
      <div class="highlight">
        <strong>Gig Details:</strong><br>
        📝 Title: ${gigTitle}<br>
        ✅ Status: Live and active<br>
        👀 Now discoverable by talent<br>
        📋 Ready to receive applications
      </div>
      
      <p>Talented creatives can now discover and apply to your gig. You'll receive notifications when applications come in!</p>
    `;

    const html = this.generateBaseTemplate(
      'Gig Live!',
      'Your opportunity is now available',
      content,
      'View Your Gig',
      actionUrl,
      'Find the perfect talent'
    );

    const text = `
Gig Posted Successfully!

Hi ${userName},

Your gig "${gigTitle}" is now live and visible to talented creatives.

Gig Details:
📝 Title: ${gigTitle}
✅ Status: Live and active
👀 Now discoverable by talent
📋 Ready to receive applications

View your gig: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // ===== PHASE 3: MARKETING TEMPLATES =====

  // 9. Weekly Digest
  static generateWeeklyDigestEmail(
    userName: string,
    stats: {
      newGigs: number;
      newShowcases: number;
      newConnections: number;
    },
    actionUrl: string
  ): EmailTemplate {
    const subject = `Your Preset Weekly Digest - ${stats.newGigs} new opportunities`;
    
    const content = `
      <h2>Your Weekly Preset Update 📊</h2>
      <p>Hi ${userName},</p>
      
      <p>Here's what's been happening in your Preset community this week:</p>
      
      <div class="highlight">
        <strong>This Week's Activity:</strong><br>
        💼 ${stats.newGigs} new gigs posted<br>
        🎨 ${stats.newShowcases} new showcases published<br>
        🤝 ${stats.newConnections} new connections made<br>
        📈 Community growing strong!
      </div>
      
      <p>Don't miss out on new opportunities! Check out the latest gigs and showcases from your community.</p>
    `;

    const html = this.generateBaseTemplate(
      'Weekly Digest',
      'Your Preset community update',
      content,
      'Explore This Week',
      actionUrl,
      'Stay connected with your community'
    );

    const text = `
Your Weekly Preset Update

Hi ${userName},

Here's what's been happening in your Preset community this week:

This Week's Activity:
💼 ${stats.newGigs} new gigs posted
🎨 ${stats.newShowcases} new showcases published
🤝 ${stats.newConnections} new connections made
📈 Community growing strong!

Explore this week's activity: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }

  // 10. Feature Announcement
  static generateFeatureAnnouncementEmail(
    userName: string,
    featureName: string,
    featureDescription: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `New Preset Feature: ${featureName}`;
    
    const content = `
      <h2>Exciting New Feature! 🚀</h2>
      <p>Hi ${userName},</p>
      
      <p>We're excited to announce a new feature that will enhance your Preset experience:</p>
      
      <div class="highlight">
        <strong>${featureName}</strong><br>
        ${featureDescription}
      </div>
      
      <p>This feature is now available to all Preset users. Try it out and let us know what you think!</p>
    `;

    const html = this.generateBaseTemplate(
      'New Feature!',
      'Enhance your Preset experience',
      content,
      'Try It Now',
      actionUrl,
      'Innovation for creatives'
    );

    const text = `
New Preset Feature: ${featureName}

Hi ${userName},

We're excited to announce a new feature: ${featureName}

${featureDescription}

Try it now: ${actionUrl}

The Preset Team
    `;

    return { subject, html, text };
  }
}

export default PresetEmailTemplates;
