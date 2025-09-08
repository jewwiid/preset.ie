export interface NotificationService {
  sendEmail(to: string, subject: string, body: string, html?: string): Promise<void>;
  sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>;
  sendSms(to: string, message: string): Promise<void>;
}