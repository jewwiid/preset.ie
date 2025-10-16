// Plunk Email Notification Service for Backup System
// Sends email notifications for backup start, completion, and failures

interface BackupNotificationData {
  projectName: string
  projectRef: string
  backupType: 'api' | 'local' | 'scheduled'
  status: 'started' | 'completed' | 'failed'
  backupId?: string
  backupSize?: string
  timestamp: string
  errorMessage?: string
  duration?: string
  nextRunTime?: string
}

interface PlunkEmailPayload {
  to: string
  subject: string
  body: string
  from?: string
  replyTo?: string
}

class PlunkNotificationService {
  private apiKey: string
  private supportEmail: string
  private baseUrl: string = 'https://api.useplunk.com/v1'

  constructor(apiKey: string, supportEmail: string) {
    this.apiKey = apiKey
    this.supportEmail = supportEmail
  }

  private createEmailContent(data: BackupNotificationData): PlunkEmailPayload {
    const { projectName, projectRef, backupType, status, timestamp, backupId, backupSize, errorMessage, duration } = data

    const subject = this.getSubject(status, projectName, backupType)
    const body = this.getEmailBody(data)

    return {
      to: this.supportEmail,
      subject,
      body,
      from: 'backups@presetie.com',
      replyTo: 'support@presetie.com'
    }
  }

  private getSubject(status: string, projectName: string, backupType: string): string {
    const statusEmoji = {
      started: '🚀',
      completed: '✅',
      failed: '❌'
    }[status] || '📋'

    return `${statusEmoji} [${status.toUpperCase()}] ${projectName} Backup - ${backupType.toUpperCase()}`
  }

  private getEmailBody(data: BackupNotificationData): string {
    const { projectName, projectRef, backupType, status, timestamp, backupId, backupSize, errorMessage, duration, nextRunTime } = data

    const statusColor = {
      started: '#3B82F6',
      completed: '#10B981',
      failed: '#EF4444'
    }[status] || '#6B7280'

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Notification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #374151; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 14px; margin-bottom: 20px; }
        .started { background-color: #EBF5FF; color: #1E40AF; }
        .completed { background-color: #ECFDF5; color: #065F46; }
        .failed { background-color: #FEF2F2; color: #991B1B; }
        .info-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #6B7280; }
        .info-value { color: #374151; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
        .error-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .error-title { font-weight: 600; color: #991B1B; margin-bottom: 10px; }
        .error-message { color: #7F1D1D; font-family: monospace; background: #FFFFFF; padding: 10px; border-radius: 4px; border: 1px solid #FCA5A5; }
        .next-run { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
        .actions { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 10px; }
        .btn-primary { background: #3B82F6; color: white; }
        .btn-secondary { background: #6B7280; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ Backup System Notification</h1>
            <div class="status-badge ${status}">${status}</div>
        </div>

        <div class="info-box">
            <h3>📊 Backup Details</h3>
            <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Project Ref:</span>
                <span class="info-value">${projectRef}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Backup Type:</span>
                <span class="info-value">${backupType.toUpperCase()}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Timestamp:</span>
                <span class="info-value">${timestamp}</span>
            </div>
            ${backupId ? `
            <div class="info-row">
                <span class="info-label">Backup ID:</span>
                <span class="info-value">${backupId}</span>
            </div>
            ` : ''}
            ${backupSize ? `
            <div class="info-row">
                <span class="info-label">Backup Size:</span>
                <span class="info-value">${backupSize}</span>
            </div>
            ` : ''}
            ${duration ? `
            <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${duration}</span>
            </div>
            ` : ''}
        </div>

        ${status === 'failed' && errorMessage ? `
        <div class="error-box">
            <div class="error-title">❌ Error Details</div>
            <div class="error-message">${errorMessage}</div>
        </div>
        ` : ''}

        ${status === 'completed' ? `
        <div class="info-box" style="background: #ECFDF5; border-color: #10B981;">
            <h3>✅ Backup Completed Successfully</h3>
            <p>Your database backup has been completed and is available for restore if needed.</p>
        </div>
        ` : ''}

        ${status === 'started' ? `
        <div class="info-box" style="background: #EBF5FF; border-color: #3B82F6;">
            <h3>🚀 Backup Started</h3>
            <p>Your database backup has been initiated. You will receive another notification when it completes.</p>
        </div>
        ` : ''}

        ${nextRunTime ? `
        <div class="next-run">
            <h4>⏰ Next Scheduled Backup</h4>
            <p><strong>${nextRunTime}</strong></p>
        </div>
        ` : ''}

        <div class="actions">
            <a href="https://supabase.com/dashboard/project/${projectRef}" class="btn btn-primary">
                View in Supabase Dashboard
            </a>
            <a href="https://presetie.com" class="btn btn-secondary">
                Visit Preset.ie
            </a>
        </div>

        <div class="footer">
            <p>This is an automated message from the Preset.ie Backup System</p>
            <p>If you have questions, please contact <a href="mailto:support@presetie.com">support@presetie.com</a></p>
            <p style="font-size: 12px; margin-top: 20px;">
                Notification ID: ${Date.now()} |
                System: v2.0 |
                Environment: Production
            </p>
        </div>
    </div>
</body>
</html>
    `

    return htmlBody
  }

  async sendNotification(data: BackupNotificationData): Promise<boolean> {
    try {
      const emailPayload = this.createEmailContent(data)

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Plunk API error: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ Email notification sent successfully:', result)
      return true

    } catch (error) {
      console.error('❌ Failed to send email notification:', error)
      return false
    }
  }

  // Convenience methods for different notification types
  async notifyBackupStarted(projectName: string, projectRef: string, backupType: 'api' | 'local' | 'scheduled' = 'api'): Promise<boolean> {
    return this.sendNotification({
      projectName,
      projectRef,
      backupType,
      status: 'started',
      timestamp: new Date().toISOString()
    })
  }

  async notifyBackupCompleted(
    projectName: string,
    projectRef: string,
    backupType: 'api' | 'local' | 'scheduled' = 'api',
    backupId?: string,
    backupSize?: string,
    duration?: string
  ): Promise<boolean> {
    return this.sendNotification({
      projectName,
      projectRef,
      backupType,
      status: 'completed',
      backupId,
      backupSize,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  async notifyBackupFailed(
    projectName: string,
    projectRef: string,
    backupType: 'api' | 'local' | 'scheduled' = 'api',
    errorMessage: string,
    duration?: string
  ): Promise<boolean> {
    return this.sendNotification({
      projectName,
      projectRef,
      backupType,
      status: 'failed',
      errorMessage,
      duration,
      timestamp: new Date().toISOString()
    })
  }
}

export default PlunkNotificationService
export { BackupNotificationData, PlunkEmailPayload }