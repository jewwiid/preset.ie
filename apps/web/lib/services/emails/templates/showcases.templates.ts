import { EmailTemplate } from '../types/email';

export function getShowcaseSubmittedForApprovalTemplate({
  talentName,
  talentEmail,
  gigTitle,
  creatorName,
  showcaseId,
  platformUrl
}: {
  talentName: string;
  talentEmail: string;
  gigTitle: string;
  creatorName: string;
  showcaseId: string;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: talentEmail,
    subject: `Showcase Review Required: ${gigTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Showcase Review Required</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fafdfc; padding: 15px; border-left: 4px solid #00876f; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 Showcase Review Required</h1>
            <p>${creatorName} has created a showcase from your gig and needs your approval</p>
          </div>
          
          <div class="content">
            <h2>Hi ${talentName}!</h2>
            
            <p><strong>${creatorName}</strong> has uploaded photos from your completed gig "<strong>${gigTitle}</strong>" and submitted them for your review.</p>
            
            <div class="highlight">
              <h3>What you need to do:</h3>
              <ul>
                <li>Review all uploaded photos</li>
                <li>Approve the showcase to make it public, or</li>
                <li>Request changes if needed</li>
              </ul>
            </div>
            
            <p>Once approved, the showcase will be visible to everyone and credited to both you and ${creatorName}.</p>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">Review Showcase</a>
            </div>
            
            <p><small>This showcase contains custom photos from your gig and requires your approval before being published.</small></p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The Preset Team</p>
            <p><a href="${platformUrl}">Visit Preset</a> | <a href="${platformUrl}/settings">Manage Notifications</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Showcase Review Required: ${gigTitle}
      
      Hi ${talentName}!
      
      ${creatorName} has uploaded photos from your completed gig "${gigTitle}" and submitted them for your review.
      
      What you need to do:
      - Review all uploaded photos
      - Approve the showcase to make it public, or
      - Request changes if needed
      
      Once approved, the showcase will be visible to everyone and credited to both you and ${creatorName}.
      
      Review Showcase: ${platformUrl}/gigs/${showcaseId}
      
      This showcase contains custom photos from your gig and requires your approval before being published.
      
      Best regards,
      The Preset Team
    `
  };
}

export function getShowcaseApprovedTemplate({
  creatorName,
  creatorEmail,
  gigTitle,
  talentName,
  showcaseId,
  platformUrl
}: {
  creatorName: string;
  creatorEmail: string;
  gigTitle: string;
  talentName: string;
  showcaseId: string;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: creatorEmail,
    subject: `🎉 Your showcase for "${gigTitle}" has been approved!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Showcase Approved</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success { background: #fafdfc; padding: 15px; border-left: 4px solid #00876f; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Showcase Approved!</h1>
            <p>Your showcase is now live and visible to everyone</p>
          </div>
          
          <div class="content">
            <h2>Congratulations ${creatorName}!</h2>
            
            <div class="success">
              <h3>✅ Your showcase has been approved!</h3>
              <p><strong>${talentName}</strong> has approved your showcase for "<strong>${gigTitle}</strong>" and it's now live!</p>
            </div>
            
            <p>Your showcase is now:</p>
            <ul>
              <li>✅ Visible to everyone on the platform</li>
              <li>✅ Featured on both your and ${talentName}'s profiles</li>
              <li>✅ Available for likes, shares, and comments</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/showcases/${showcaseId}" class="button">View Your Showcase</a>
            </div>
            
            <p>Great work on creating such an amazing showcase! Keep up the excellent photography.</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The Preset Team</p>
            <p><a href="${platformUrl}">Visit Preset</a> | <a href="${platformUrl}/showcases">Browse Showcases</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Your showcase for "${gigTitle}" has been approved!
      
      Congratulations ${creatorName}!
      
      ✅ Your showcase has been approved!
      ${talentName} has approved your showcase for "${gigTitle}" and it's now live!
      
      Your showcase is now:
      ✅ Visible to everyone on the platform
      ✅ Featured on both your and ${talentName}'s profiles
      ✅ Available for likes, shares, and comments
      
      View Your Showcase: ${platformUrl}/showcases/${showcaseId}
      
      Great work on creating such an amazing showcase! Keep up the excellent photography.
      
      Best regards,
      The Preset Team
    `
  };
}

export function getShowcaseChangesRequestedTemplate({
  creatorName,
  creatorEmail,
  gigTitle,
  talentName,
  feedback,
  showcaseId,
  platformUrl
}: {
  creatorName: string;
  creatorEmail: string;
  gigTitle: string;
  talentName: string;
  feedback: string;
  showcaseId: string;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: creatorEmail,
    subject: `📝 Changes requested for your "${gigTitle}" showcase`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Changes Requested</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .feedback { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Changes Requested</h1>
            <p>${talentName} has requested changes to your showcase</p>
          </div>
          
          <div class="content">
            <h2>Hi ${creatorName}!</h2>
            
            <p><strong>${talentName}</strong> has reviewed your showcase for "<strong>${gigTitle}</strong>" and requested some changes before approval.</p>
            
            <div class="feedback">
              <h3>💬 Feedback from ${talentName}:</h3>
              <p>"${feedback}"</p>
            </div>
            
            <p>Don't worry - this is part of the collaborative process! You can:</p>
            <ul>
              <li>Review the feedback and make the requested changes</li>
              <li>Upload new photos if needed</li>
              <li>Resubmit for approval when ready</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">Make Changes</a>
            </div>
            
            <p><small>Remember: Both you and ${talentName} need to be happy with the showcase before it goes live.</small></p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The Preset Team</p>
            <p><a href="${platformUrl}">Visit Preset</a> | <a href="${platformUrl}/showcases">Browse Showcases</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      📝 Changes requested for your "${gigTitle}" showcase
      
      Hi ${creatorName}!
      
      ${talentName} has reviewed your showcase for "${gigTitle}" and requested some changes before approval.
      
      💬 Feedback from ${talentName}:
      "${feedback}"
      
      Don't worry - this is part of the collaborative process! You can:
      - Review the feedback and make the requested changes
      - Upload new photos if needed
      - Resubmit for approval when ready
      
      Make Changes: ${platformUrl}/gigs/${showcaseId}
      
      Remember: Both you and ${talentName} need to be happy with the showcase before it goes live.
      
      Best regards,
      The Preset Team
    `
  };
}