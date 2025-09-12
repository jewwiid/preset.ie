import type { ImageGenService, CreateImageTask, TaskId } from '@preset/application/ports/ImageGenService';

export interface NanoBananaConfig {
  apiKey: string;
  baseUrl: string;
  callbackUrl: string;
}

export class NanoBananaAdapter implements ImageGenService {
  constructor(private config: NanoBananaConfig) {}

  async createTask(input: CreateImageTask): Promise<{ taskId: TaskId }> {
    const requestBody = {
      type: 'IMAGETOIMAGE',
      input: {
        image: input.imageUrls?.[0] || '',
        model: 'enhance-v1',
        prompt: input.prompt,
        negativePrompt: 'blur, distortion, artifacts',
        width: 1024,
        height: 1024,
        guidanceScale: 7.5,
        strength: input.extras?.strength || 0.75,
        numInferenceSteps: 30,
        numOutputs: input.n || 1,
      },
      callbackUrl: input.callbackUrl,
    };

    const response = await fetch(`${this.config.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`NanoBanana API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return { taskId: data.id };
  }

  async getTaskStatus(taskId: TaskId): Promise<{
    state: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    resultUrls?: string[];
    providerMeta?: unknown;
    errorCode?: string;
    errorMessage?: string;
  }> {
    // NanoBanana doesn't have a polling endpoint, it uses callbacks only
    // Return a default state - the actual status will come via webhook
    return {
      state: 'RUNNING',
      resultUrls: [],
      providerMeta: { taskId },
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
    const payload = body as any;
    const taskId = payload.id || payload.task_id;
    const isSuccess = payload.status === 'completed' || payload.success === true;

    return {
      taskId,
      state: isSuccess ? 'SUCCESS' : 'FAILED',
      resultUrls: payload.enhanced_url ? [payload.enhanced_url] : [],
      errorCode: isSuccess ? undefined : 'PROVIDER_ERROR',
      errorMessage: payload.error || payload.message,
    };
  }
}
