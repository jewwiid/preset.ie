/**
 * Shared Email Templates
 * Base template structure and reusable components
 * 
 * NO EMOJIS - Professional design
 * Brand Colors: #00876f, #0d7d72
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';

/**
 * Base email wrapper template
 * All emails use this as the foundation
 */
export function getEmailTemplate(content: string, userEmail?: string, userId?: string): string {
  const unsubscribeUrl = userEmail 
    ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}${userId ? `&userId=${userId}` : ''}`
    : `${baseUrl}/unsubscribe`;
  
  const preferencesUrl = userId
    ? `${baseUrl}/settings/email-preferences`
    : `${baseUrl}/settings`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 40px 30px; text-align: center;">
      <a href="${baseUrl}" style="color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; letter-spacing: -0.5px;">Preset</a>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0;">© 2025 Preset.ie - Creative Collaboration Platform</p>
      <p style="margin: 0;">
        <a href="${preferencesUrl}" style="color: #00876f; text-decoration: none;">Email Preferences</a> | 
        <a href="${unsubscribeUrl}" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
      </p>
      ${userEmail ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Sent to ${userEmail}</p>` : ''}
    </div>
    
  </div>
</body>
</html>
  `.trim();
}

/**
 * Reusable button component
 */
export function getButton(text: string, url: string, type: 'primary' | 'secondary' | 'success' = 'primary'): string {
  const styles = {
    primary: 'background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: #ffffff;',
    secondary: 'background: #ffffff; color: #00876f; border: 2px solid #00876f;',
    success: 'background: #10b981; color: #ffffff;'
  };

  return `<a href="${url}" style="display: inline-block; padding: 16px 32px; ${styles[type]} text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${text}</a>`;
}

/**
 * Info box component
 */
export function getInfoBox(title: string, content: string): string {
  return `
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #1f2937;">${title}</h4>
      <p style="margin-bottom: 0; color: #4b5563;">${content}</p>
    </div>
  `;
}

/**
 * Warning box component
 */
export function getWarningBox(title: string, content: string): string {
  return `
    <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>${title}</strong><br>
        ${content}
      </p>
    </div>
  `;
}

/**
 * Success box component
 */
export function getSuccessBox(title: string, content: string): string {
  return `
    <div style="background: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>${title}</strong><br>
        ${content}
      </p>
    </div>
  `;
}

/**
 * Highlight card with gradient background
 */
export function getHighlightCard(title: string, content: string): string {
  return `
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
      <h2 style="margin: 0 0 15px 0; color: white; font-size: 24px;">${title}</h2>
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
        ${content}
      </div>
    </div>
  `;
}

export { baseUrl };

