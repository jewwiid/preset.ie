import type { ImageGenService, CreateImageTask, TaskId } from '@preset/application/ports/ImageGenService';
import { createHmac } from 'crypto';

export interface WaveSpeedConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

export class SeedreamWaveSpeedAdapter implements ImageGenService {
  constructor(private config: WaveSpeedConfig) {}

  async createTask(input: CreateImageTask): Promise<{ taskId: TaskId }> {
    const endpoint = this.getEndpointForMode(input.mode);
    
    const requestBody = {
      prompt: input.prompt,
      size: input.extras?.size || '2048*2048',
      seed: input.extras?.seed || -1,
      enable_base64_output: false,
      enable_sync_mode: false,
      ...(input.n && { num_images: input.n }),
      ...(input.imageUrls?.length && { image_urls: input.imageUrls }),
      callback_url: input.callbackUrl,
    };

    const response = await fetch(`${this.config.baseUrl}/api/v3/bytedance/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`WaveSpeed API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`WaveSpeed API error: ${data.message}`);
    }

    return { taskId: data.data.id };
  }

  async getTaskStatus(taskId: TaskId): Promise<{
    state: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    resultUrls?: string[];
    providerMeta?: unknown;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const response = await fetch(`${this.config.baseUrl}/api/v3/predictions/${taskId}/result`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WaveSpeed API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const stateMap: Record<string, 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'> = {
      'created': 'PENDING',
      'processing': 'RUNNING',
      'completed': 'SUCCESS',
      'failed': 'FAILED',
    };

    const state = stateMap[data.data?.status] || 'RUNNING';

    return {
      state,
      resultUrls: data.data?.outputs || [],
      providerMeta: data.data,
      errorCode: data.data?.error ? 'PROVIDER_ERROR' : undefined,
      errorMessage: data.data?.error,
    };
  }

  async verifyAndParseWebhook(
    headers: Record<string, string>,
    body: unknown
  ): Promise<{
    taskId: TaskId;
    state: 'SUCCESS' | 'FAILED';
    resultUrls?: string[];
    errorCode?: string;
    errorMessage?: string;
  }> {
    // Verify webhook signature
    const signature = headers['x-wavespeed-signature'] || headers['x-signature'];
    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    const expectedSignature = this.generateSignature(JSON.stringify(body));
    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const payload = body as any;
    const taskId = payload.data?.id || payload.task_id;
    const isSuccess = payload.data?.status === 'completed' || payload.code === 200;

    return {
      taskId,
      state: isSuccess ? 'SUCCESS' : 'FAILED',
      resultUrls: payload.data?.outputs || [],
      errorCode: isSuccess ? undefined : 'WEBHOOK_ERROR',
      errorMessage: payload.data?.error || payload.message,
    };
  }

  private getEndpointForMode(mode: 'text-to-image' | 'image-edit'): string {
    switch (mode) {
      case 'text-to-image':
        return 'seedream-v4';
      case 'image-edit':
        return 'seedream-v4-edit';
      default:
        return 'seedream-v4';
    }
  }

  private generateSignature(payload: string): string {
    return createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
  }
}
