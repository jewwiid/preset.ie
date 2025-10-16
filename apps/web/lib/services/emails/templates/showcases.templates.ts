import { EmailTemplate } from '../../email-service';

export function getShowcaseSubmittedForApprovalTemplate({
  talentName,
  talentEmail,
  gigTitle,
  creatorName,
  showcaseId,
  totalTalents,
  platformUrl
}: {
  talentName: string;
  talentEmail: string;
  gigTitle: string;
  creatorName: string;
  showcaseId: string;
  totalTalents?: number;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: talentEmail,
    subject: `📸 Review showcase for "${gigTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Showcase Review Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .review { background: #fafdfc; padding: 15px; border-left: 4px solid #00876f; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 Showcase Review Request</h1>
            <p>Please review and approve the showcase</p>
          </div>
          
          <div class="content">
            <h2>Hi ${talentName}!</h2>
            
            <div class="review">
              <h3>📋 Review Required:</h3>
              <p><strong>${creatorName}</strong> has submitted a showcase for "<strong>${gigTitle}</strong>" and needs your approval.</p>
              ${totalTalents && totalTalents > 1 ? `<p>This showcase involves <strong>${totalTalents} talents</strong> - all must approve before it goes live.</p>` : ''}
            </div>
            
            <p>Please review the showcase and either approve it or request changes. Your feedback helps ensure everyone is happy with how the work is presented.</p>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">Review Showcase</a>
            </div>
            
            <p><small>You can view the showcase, provide feedback, and approve or request changes directly from the gig page.</small></p>
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
      📸 Review showcase for "${gigTitle}"
      
      Hi ${talentName}!
      
      📋 Review Required:
      ${creatorName} has submitted a showcase for "${gigTitle}" and needs your approval.
      ${totalTalents && totalTalents > 1 ? `This showcase involves ${totalTalents} talents - all must approve before it goes live.` : ''}
      
      Please review the showcase and either approve it or request changes. Your feedback helps ensure everyone is happy with how the work is presented.
      
      Review Showcase: ${platformUrl}/gigs/${showcaseId}
      
      You can view the showcase, provide feedback, and approve or request changes directly from the gig page.
      
      Best regards,
      The Preset Team
    `
  };
}

export function getShowcaseApprovedTemplate({
  creatorName,
  creatorEmail,
  talentName,
  gigTitle,
  totalTalents,
  approvedTalents,
  showcaseId,
  platformUrl
}: {
  creatorName: string;
  creatorEmail: string;
  talentName: string;
  gigTitle: string;
  totalTalents: number;
  approvedTalents: number;
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
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success { background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
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
              <h3>✨ All Talents Approved!</h3>
              <p>All <strong>${totalTalents}</strong> talent${totalTalents === 1 ? '' : 's'} have approved your showcase for "<strong>${gigTitle}</strong>" and it's now live!</p>
              <p>Status: <strong>${approvedTalents}/${totalTalents} talents approved</strong></p>
            </div>
            
            <p>Your showcase is now visible to everyone on the platform and properly credited to all participants.</p>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">View Live Showcase</a>
            </div>
            
            <p>Share your showcase with your network and celebrate the great work!</p>
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
      
      ✨ All Talents Approved!
      All ${totalTalents} talent${totalTalents === 1 ? '' : 's'} have approved your showcase for "${gigTitle}" and it's now live!
      Status: ${approvedTalents}/${totalTalents} talents approved
      
      Your showcase is now visible to everyone on the platform and properly credited to all participants.
      
      View Live Showcase: ${platformUrl}/gigs/${showcaseId}
      
      Share your showcase with your network and celebrate the great work!
      
      Best regards,
      The Preset Team
    `
  };
}

export function getShowcasePartialApprovalTemplate({
  creatorName,
  creatorEmail,
  talentName,
  gigTitle,
  approvedCount,
  totalTalents,
  showcaseId,
  platformUrl
}: {
  creatorName: string;
  creatorEmail: string;
  talentName: string;
  gigTitle: string;
  approvedCount: number;
  totalTalents: number;
  showcaseId: string;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: creatorEmail,
    subject: `👍 Partial approval for "${gigTitle}" showcase`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Partial Approval</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .progress { background: #fafdfc; padding: 15px; border-left: 4px solid #00876f; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👍 Partial Approval</h1>
            <p>Another talent has approved your showcase</p>
          </div>
          
          <div class="content">
            <h2>Hi ${creatorName}!</h2>
            
            <div class="progress">
              <h3>📊 Approval Progress:</h3>
              <p><strong>${talentName}</strong> has approved your showcase for "<strong>${gigTitle}</strong>"!</p>
              <p>Status: <strong>${approvedCount}/${totalTalents} talents approved</strong></p>
            </div>
            
            <p>You're making great progress! ${totalTalents - approvedCount} talent${totalTalents - approvedCount === 1 ? '' : 's'} still need${totalTalents - approvedCount === 1 ? 's' : ''} to review and approve.</p>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">View Progress</a>
            </div>
            
            <p><small>Once all talents approve, your showcase will go live automatically!</small></p>
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
      👍 Partial approval for "${gigTitle}" showcase
      
      Hi ${creatorName}!
      
      📊 Approval Progress:
      ${talentName} has approved your showcase for "${gigTitle}"!
      Status: ${approvedCount}/${totalTalents} talents approved
      
      You're making great progress! ${totalTalents - approvedCount} talent${totalTalents - approvedCount === 1 ? '' : 's'} still need${totalTalents - approvedCount === 1 ? 's' : ''} to review and approve.
      
      View Progress: ${platformUrl}/gigs/${showcaseId}
      
      Once all talents approve, your showcase will go live automatically!
      
      Best regards,
      The Preset Team
    `
  };
}

export function getShowcaseChangesRequestedTemplate({
  creatorName,
  creatorEmail,
  talentName,
  gigTitle,
  feedback,
  totalTalents,
  changeRequests,
  showcaseId,
  platformUrl
}: {
  creatorName: string;
  creatorEmail: string;
  talentName: string;
  gigTitle: string;
  feedback: string;
  totalTalents: number;
  changeRequests: number;
  showcaseId: string;
  platformUrl: string;
}): EmailTemplate {
  return {
    to: creatorEmail,
    subject: `⚠️ Changes requested for "${gigTitle}" showcase`,
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
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .feedback { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .blocked { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Changes Requested</h1>
            <p>Please address the feedback to proceed</p>
          </div>
          
          <div class="content">
            <h2>Hi ${creatorName}!</h2>
            
            <div class="blocked">
              <h3>🚫 Showcase Blocked</h3>
              <p><strong>${talentName}</strong> has requested changes to your showcase for "<strong>${gigTitle}</strong>".</p>
              ${totalTalents > 1 ? `<p>Status: <strong>${changeRequests}/${totalTalents} change request${changeRequests === 1 ? '' : 's'}</strong> - showcase blocked until resolved.</p>` : ''}
            </div>
            
            <div class="feedback">
              <h3>💬 Feedback:</h3>
              <p>"${feedback}"</p>
            </div>
            
            <p>Please review the feedback and make the necessary changes. Once you've addressed the concerns, you can resubmit the showcase for approval.</p>
            
            <div style="text-align: center;">
              <a href="${platformUrl}/gigs/${showcaseId}" class="button">Address Feedback</a>
            </div>
            
            <p><small>${totalTalents > 1 ? 'All talents must approve before the showcase goes live.' : 'The talent must approve before the showcase goes live.'}</small></p>
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
      ⚠️ Changes requested for "${gigTitle}" showcase
      
      Hi ${creatorName}!
      
      🚫 Showcase Blocked
      ${talentName} has requested changes to your showcase for "${gigTitle}".
      ${totalTalents > 1 ? `Status: ${changeRequests}/${totalTalents} change request${changeRequests === 1 ? '' : 's'} - showcase blocked until resolved.` : ''}
      
      💬 Feedback:
      "${feedback}"
      
      Please review the feedback and make the necessary changes. Once you've addressed the concerns, you can resubmit the showcase for approval.
      
      Address Feedback: ${platformUrl}/gigs/${showcaseId}
      
      ${totalTalents > 1 ? 'All talents must approve before the showcase goes live.' : 'The talent must approve before the showcase goes live.'}

      Best regards,
      The Preset Team
    `
  };
}

// Additional missing templates for email system
export function getShowcaseApprovalRequestTemplate(
  collaboratorName: string,
  gigTitle: string,
  showcaseUrl: string
): EmailTemplate {
  return {
    to: '',
    subject: `📸 Approval requested for showcase: "${gigTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>📸 Approval Requested</h2>
        <p>Hi ${collaboratorName},</p>
        <p>Your approval is requested for a showcase submission: <strong>"${gigTitle}"</strong></p>
        <p><a href="${showcaseUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Showcase</a></p>
        <p>Best regards,<br>The Preset Team</p>
      </div>
    `,
    text: `
      Approval Requested for showcase: "${gigTitle}"

      Hi ${collaboratorName},

      Your approval is requested for a showcase submission: "${gigTitle}"

      Review: ${showcaseUrl}

      Best regards,
      The Preset Team
    `
  };
}

export function getShowcasePublishedTemplate(
  name: string,
  collaboratorName: string,
  showcaseUrl: string
): EmailTemplate {
  return {
    to: '',
    subject: `🎉 Showcase published: "${name}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Showcase Published!</h2>
        <p>Hi ${collaboratorName},</p>
        <p>Your showcase has been published and is now live: <strong>"${name}"</strong></p>
        <p><a href="${showcaseUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Showcase</a></p>
        <p>Best regards,<br>The Preset Team</p>
      </div>
    `,
    text: `
      Showcase published: "${name}"

      Hi ${collaboratorName},

      Your showcase has been published and is now live: "${name}"

      View: ${showcaseUrl}

      Best regards,
      The Preset Team
    `
  };
}

export function getShowcaseFeaturedTemplate(
  showcaseTitle: string,
  showcaseUrl: string
): EmailTemplate {
  return {
    to: '',
    subject: `⭐ Your showcase has been featured!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⭐ Showcase Featured!</h2>
        <p>Congratulations!</p>
        <p>Your showcase has been selected as a featured submission: <strong>"${showcaseTitle}"</strong></p>
        <p><a href="${showcaseUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Featured Showcase</a></p>
        <p>Best regards,<br>The Preset Team</p>
      </div>
    `,
    text: `
      Your showcase has been featured!

      Congratulations!

      Your showcase has been selected as a featured submission: "${showcaseTitle}"

      View: ${showcaseUrl}

      Best regards,
      The Preset Team
    `
  };
}