/**
 * Review Email Templates
 * Review requests, received reviews
 */

import { getEmailTemplate } from './shared.templates';

export function getReviewRequestTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  reviewUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">How Was Your Experience?</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Share your experience working with ${collaboratorName}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Completed Gig</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0;">Collaborator: ${collaboratorName}</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">Your honest feedback helps build trust in our community and helps others make informed decisions.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Leave a Review
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> Constructive reviews help everyone improve. Be honest but professional!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getReviewReceivedTemplate(
  recipientName: string,
  reviewerName: string,
  rating: number,
  gigTitle: string,
  reviewText: string,
  profileUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  const ratingColor = rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">You Received a Review!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${reviewerName} left you a review</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">For Gig</p>
        <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
        <div style="font-size: 28px; margin: 15px 0;">${stars}</div>
        <p style="color: ${ratingColor}; font-size: 24px; font-weight: 700; margin: 0;">${rating}.0 / 5.0</p>
      </div>

      ${reviewText ? `
        <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="color: #4b5563; font-size: 15px; margin: 0; font-style: italic;">"${reviewText}"</p>
          <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">— ${reviewerName}</p>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Your Profile
      </a>
    </div>

    ${rating >= 4 ? `
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 30px;">
        <p style="color: #166534; font-size: 14px; margin: 0;">
          <strong>🌟 Great job!</strong> Positive reviews help you get more bookings!
        </p>
      </div>
    ` : ''}
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getReviewReminderTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  daysAgo: number,
  reviewUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Don't Forget to Review!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">It's been ${daysAgo} days since you worked with ${collaboratorName}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">Your review helps ${collaboratorName} build their reputation and helps others in the community make better decisions.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Leave a Review
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

