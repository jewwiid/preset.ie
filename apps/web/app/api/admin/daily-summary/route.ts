import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple Plunk service for daily summaries
class SimplePlunkService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.useplunk.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendTransactionalEmail(options: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    name?: string;
  }): Promise<{ success: boolean; emails: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          body: options.body,
          subscribed: true,
          name: options.name,
          from: options.from,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }
}

function getPlunkService(): SimplePlunkService {
  // Try multiple sources for the API key
  const apiKey = process.env.PLUNK_API_KEY || 
                 process.env.NEXT_PUBLIC_PLUNK_API_KEY ||
                 'sk_410545c78baa04e967963991f1ca83d949bf156aeba302f1'; // Fallback for testing
  
  console.log('Environment check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 10),
    source: process.env.PLUNK_API_KEY ? 'PLUNK_API_KEY' : 
            process.env.NEXT_PUBLIC_PLUNK_API_KEY ? 'NEXT_PUBLIC_PLUNK_API_KEY' : 'hardcoded',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('PLUNK'))
  });
  
  if (!apiKey) {
    throw new Error('PLUNK_API_KEY environment variable is not set');
  }
  return new SimplePlunkService(apiKey);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface DailySummaryData {
  date: string;
  generationsToday: number;
  costTodayUsd: number;
  activeUsersToday: number;
  successRateToday: number;
  refundsToday: number;
  providerUsage: Array<{
    name: string;
    generations: number;
    costUsd: number;
    avgCostPerGeneration: number;
  }>;
  topUsers: Array<{
    userId: string;
    displayName: string;
    generations: number;
    creditsUsed: number;
  }>;
  systemAlerts: Array<{
    type: string;
    level: string;
    message: string;
    created_at: string;
  }>;
}

async function generateDailySummary(): Promise<DailySummaryData> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get today's date range
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // 1. Today's generations and costs
  const { data: todayTasks } = await supabase
    .from('enhancement_tasks')
    .select(`
      id,
      user_id,
      provider,
      status,
      created_at,
      credit_transactions!inner(cost_usd, credits_used)
    `)
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  const generationsToday = todayTasks?.length || 0;
  const costTodayUsd = todayTasks?.reduce((sum, task) => {
    const cost = task.credit_transactions?.[0]?.cost_usd || 0;
    return sum + cost;
  }, 0) || 0;

  const successfulTasks = todayTasks?.filter(task => task.status === 'completed').length || 0;
  const successRateToday = generationsToday > 0 ? Math.round((successfulTasks / generationsToday) * 100) : 0;

  const activeUsersToday = generationsToday > 0 ? new Set(todayTasks?.map(t => t.user_id)).size : 0;

  // 2. Today's refunds
  const { data: todayRefunds } = await supabase
    .from('credit_transactions')
    .select('credits_used')
    .eq('transaction_type', 'refund')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  const refundsToday = todayRefunds?.reduce((sum, refund) => sum + refund.credits_used, 0) || 0;

  // 3. Provider usage breakdown
  const providerStats: Record<string, { generations: number; cost: number }> = {};
  todayTasks?.forEach(task => {
    const provider = task.provider || 'unknown';
    const cost = task.credit_transactions?.[0]?.cost_usd || 0;
    
    if (!providerStats[provider]) {
      providerStats[provider] = { generations: 0, cost: 0 };
    }
    providerStats[provider].generations += 1;
    providerStats[provider].cost += cost;
  });

  const providerUsage = Object.entries(providerStats).map(([name, stats]) => ({
    name,
    generations: stats.generations,
    costUsd: Number(stats.cost.toFixed(2)),
    avgCostPerGeneration: stats.generations > 0 ? Number((stats.cost / stats.generations).toFixed(4)) : 0
  }));

  // 4. Top users by generation count
  const userStats: Record<string, { generations: number; creditsUsed: number }> = {};
  todayTasks?.forEach(task => {
    const userId = task.user_id;
    const creditsUsed = task.credit_transactions?.[0]?.credits_used || 0;
    
    if (!userStats[userId]) {
      userStats[userId] = { generations: 0, creditsUsed: 0 };
    }
    userStats[userId].generations += 1;
    userStats[userId].creditsUsed += creditsUsed;
  });

  // Get user display names
  const userIds = Object.keys(userStats);
  const { data: users } = await supabase
    .from('users_profile')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const topUsers = Object.entries(userStats)
    .map(([userId, stats]) => {
      const user = users?.find(u => u.user_id === userId);
      return {
        userId,
        displayName: user?.display_name || 'Unknown User',
        generations: stats.generations,
        creditsUsed: stats.creditsUsed
      };
    })
    .sort((a, b) => b.generations - a.generations)
    .slice(0, 5); // Top 5 users

  // 5. System alerts from today
  const { data: systemAlerts } = await supabase
    .from('system_alerts')
    .select('type, level, message, created_at')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    date: todayStart.toISOString().split('T')[0],
    generationsToday,
    costTodayUsd: Number(costTodayUsd.toFixed(2)),
    activeUsersToday,
    successRateToday,
    refundsToday,
    providerUsage,
    topUsers,
    systemAlerts: systemAlerts || []
  };
}

function generateEmailHTML(data: DailySummaryData): string {
  const hasActivity = data.generationsToday > 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Admin Summary - ${data.date}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      color: #0f172a; 
      background: #f8fafc; 
      margin: 0; 
      padding: 20px; 
      line-height: 1.6;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 12px; 
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #00876f 0%, #006b5a 100%); 
      padding: 40px; 
      text-align: center; 
      color: white;
    }
    .logo { 
      font-size: 32px; 
      font-weight: 700; 
      margin-bottom: 8px;
    }
    .subtitle {
      color: #ccfbef;
      font-size: 16px;
      margin: 0;
    }
    .content { 
      padding: 40px; 
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8fafc;
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #00876f;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #00876f;
      margin-bottom: 8px;
    }
    .stat-label {
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
    }
    .section {
      margin: 40px 0;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .provider-table, .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .provider-table th, .user-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .provider-table td, .user-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .provider-table tr:hover, .user-table tr:hover {
      background: #f8fafc;
    }
    .alert-item {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 8px 0;
      border-radius: 4px;
    }
    .alert-error {
      background: #fee2e2;
      border-left-color: #ef4444;
    }
    .alert-warning {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }
    .no-activity {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .no-activity-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .footer { 
      background: #f8fafc; 
      padding: 30px; 
      text-align: center; 
      color: #64748b; 
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #00876f;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📊 Daily Admin Summary</div>
      <p class="subtitle">${data.date} • Preset Platform</p>
    </div>
    
    <div class="content">
      ${hasActivity ? `
        <!-- Summary Stats -->
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-value">${data.generationsToday}</div>
            <div class="stat-label">Generations Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${data.costTodayUsd}</div>
            <div class="stat-label">WaveSpeed Costs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.activeUsersToday}</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.successRateToday}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
          ${data.refundsToday > 0 ? `
          <div class="stat-card">
            <div class="stat-value">${data.refundsToday}</div>
            <div class="stat-label">Credits Refunded</div>
          </div>
          ` : ''}
        </div>

        ${data.providerUsage.length > 0 ? `
        <!-- Provider Usage -->
        <div class="section">
          <h3 class="section-title">🤖 Provider Usage</h3>
          <table class="provider-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Generations</th>
                <th>Total Cost</th>
                <th>Avg Cost/Gen</th>
              </tr>
            </thead>
            <tbody>
              ${data.providerUsage.map(provider => `
                <tr>
                  <td><strong>${provider.name}</strong></td>
                  <td>${provider.generations}</td>
                  <td>$${provider.costUsd}</td>
                  <td>$${provider.avgCostPerGeneration}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${data.topUsers.length > 0 ? `
        <!-- Top Users -->
        <div class="section">
          <h3 class="section-title">👥 Top Users Today</h3>
          <table class="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Generations</th>
                <th>Credits Used</th>
              </tr>
            </thead>
            <tbody>
              ${data.topUsers.map(user => `
                <tr>
                  <td>${user.displayName}</td>
                  <td>${user.generations}</td>
                  <td>${user.creditsUsed}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${data.systemAlerts.length > 0 ? `
        <!-- System Alerts -->
        <div class="section">
          <h3 class="section-title">⚠️ System Alerts</h3>
          ${data.systemAlerts.map(alert => `
            <div class="alert-item ${alert.level === 'error' ? 'alert-error' : alert.level === 'warning' ? 'alert-warning' : ''}">
              <strong>${alert.type.toUpperCase()}</strong> - ${alert.message}
              <br><small>${new Date(alert.created_at).toLocaleString()}</small>
            </div>
          `).join('')}
        </div>
        ` : ''}
      ` : `
        <!-- No Activity -->
        <div class="no-activity">
          <div class="no-activity-icon">😴</div>
          <h3>No Activity Today</h3>
          <p>No generations or system alerts recorded for ${data.date}.</p>
          <p>Check back tomorrow or review the <a href="https://presetie.com/admin/dashboard">admin dashboard</a> for real-time data.</p>
        </div>
      `}
    </div>
    
    <div class="footer">
      <p><strong>Preset Platform</strong> - Daily Admin Summary</p>
      <p>
        <a href="https://presetie.com/admin/dashboard">Admin Dashboard</a> • 
        <a href="https://presetie.com/admin/logs">System Logs</a> • 
        <a href="https://presetie.com/support">Support</a>
      </p>
      <p>© 2025 Presetie.com. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Get admin email from request body
    const { adminEmail } = await request.json();
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      );
    }

    // Generate daily summary data
    const summaryData = await generateDailySummary();
    
    // Generate email content
    const emailHTML = generateEmailHTML(summaryData);
    
    // Send email via Plunk
    const plunk = getPlunkService();
    const emailResult = await plunk.sendTransactionalEmail({
      to: adminEmail,
      subject: `📊 Daily Admin Summary - ${summaryData.date}`,
      body: emailHTML,
      from: 'support@presetie.com',
      name: 'Preset Support'
    });

    return NextResponse.json({
      success: true,
      message: 'Daily summary email sent successfully',
      summary: summaryData,
      emailResult
    });

  } catch (error: any) {
    console.error('Daily summary email error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send daily summary email', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to preview the summary without sending email
export async function GET(request: NextRequest) {
  try {
    const summaryData = await generateDailySummary();
    const emailHTML = generateEmailHTML(summaryData);
    
    return new NextResponse(emailHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Daily summary preview error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate daily summary', details: error.message },
      { status: 500 }
    );
  }
}
