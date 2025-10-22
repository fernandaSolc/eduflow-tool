import { API_CONFIG } from '@/lib/api-config';
import type { Chapter } from './definitions';

export interface CreateChapterRequest {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  subject: string;
  educationalLevel: string;
  targetAudience: string;
  template: string;
  philosophy: string;
  chapterNumber?: number;
  additionalContext?: string;
  pdfUrls?: string[];
  aiOptions?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    includeActivities?: boolean;
    includeAssessments?: boolean;
  };
}

export class AIService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = API_CONFIG.AI_SERVICE.BASE_URL;
    this.apiKey = API_CONFIG.AI_SERVICE.API_KEY;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };

    const config: RequestInit = {
      ...options,
      method,
      headers,
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Erro do AI Service: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Erro do AI Service: ${response.status} ${response.statusText}. ${errorBody}`);
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text as any;
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest(API_CONFIG.AI_SERVICE.ENDPOINTS.HEALTH);
  }

  async checkBackendStatus(): Promise<{
    backendOnline: boolean;
    aiServiceHealth: boolean;
    backendInfo: any;
    timestamp: string;
  }> {
    return this.makeRequest(API_CONFIG.AI_SERVICE.ENDPOINTS.BACKEND_STATUS);
  }

  async createChapter(request: CreateChapterRequest): Promise<Chapter> {
    return this.makeRequest<Chapter>(
      API_CONFIG.AI_SERVICE.ENDPOINTS.CREATE_CHAPTER,
      'POST',
      request
    );
  }

  async continueChapter(chapterId: string, continueType: string, additionalContext?: string): Promise<Chapter> {
    return this.makeRequest<Chapter>(
      API_CONFIG.AI_SERVICE.ENDPOINTS.CONTINUE_CHAPTER,
      'POST',
      {
        chapterId,
        continueType,
        additionalContext
      }
    );
  }

  async getChapter(chapterId: string): Promise<Chapter> {
    return this.makeRequest<Chapter>(
      `${API_CONFIG.AI_SERVICE.ENDPOINTS.GET_CHAPTER}/${chapterId}`
    );
  }

  async getCourseChapters(courseId: string): Promise<Chapter[]> {
    return this.makeRequest<Chapter[]>(
      `${API_CONFIG.AI_SERVICE.ENDPOINTS.GET_COURSE_CHAPTERS}/${courseId}/chapters`
    );
  }
}

export const aiService = new AIService();
