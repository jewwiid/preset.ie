import { PlunkService } from './plunk.service'

export interface ContactImportData {
  email: string
  firstName?: string
  lastName?: string
  subscribed?: boolean
  [key: string]: any
}

export interface ImportResult {
  success: boolean
  email: string
  error?: string
  response?: any
}

export class PlunkBulkImportService {
  private plunkService: PlunkService

  constructor() {
    this.plunkService = new PlunkService()
  }

  /**
   * Import contacts from CSV data
   */
  async importFromCSV(
    csvData: string[][],
    options: {
      emailIndex?: number
      fieldMapping?: Record<string, number>
      delay?: number
    } = {}
  ): Promise<ImportResult[]> {
    const {
      emailIndex = 0,
      fieldMapping = {},
      delay = 100 // 100ms delay between requests
    } = options

    const results: ImportResult[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      if (row.length <= emailIndex) {
        results.push({
          success: false,
          email: '',
          error: 'Not enough columns'
        })
        continue
      }

      const email = row[emailIndex]?.trim()
      if (!email || !this.isValidEmail(email)) {
        results.push({
          success: false,
          email: email || '',
          error: 'Invalid email'
        })
        continue
      }

      // Prepare contact data
      const contactData: ContactImportData = {
        email,
        subscribed: true
      }

      // Map additional fields
      for (const [fieldName, columnIndex] of Object.entries(fieldMapping)) {
        if (columnIndex < row.length && row[columnIndex]) {
          contactData[fieldName] = row[columnIndex].trim()
        }
      }

      try {
        const result = await this.importContact(contactData)
        results.push(result)
        
        // Rate limiting
        if (i < csvData.length - 1) {
          await this.delay(delay)
        }
      } catch (error) {
        results.push({
          success: false,
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Import a single contact
   */
  private async importContact(contactData: ContactImportData): Promise<ImportResult> {
    try {
      const response = await this.plunkService.trackEvent('contact_imported', {
        email: contactData.email,
        ...contactData
      })

      return {
        success: true,
        email: contactData.email,
        response
      }
    } catch (error) {
      return {
        success: false,
        email: contactData.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Import users from your database
   */
  async importExistingUsers(): Promise<ImportResult[]> {
    try {
      // This would fetch users from your Supabase database
      const response = await fetch('/api/users/export-for-plunk')
      const users = await response.json()

      const results: ImportResult[] = []

      for (const user of users) {
        const contactData: ContactImportData = {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscribed: user.email_verified || false
        }

        const result = await this.importContact(contactData)
        results.push(result)

        // Rate limiting
        await this.delay(100)
      }

      return results
    } catch (error) {
      console.error('Error importing existing users:', error)
      return []
    }
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get import statistics
   */
  getImportStats(results: ImportResult[]): {
    total: number
    successful: number
    failed: number
    successRate: number
  } {
    const total = results.length
    const successful = results.filter(r => r.success).length
    const failed = total - successful
    const successRate = total > 0 ? (successful / total) * 100 : 0

    return {
      total,
      successful,
      failed,
      successRate: Math.round(successRate * 100) / 100
    }
  }
}
