import { API_CONFIG } from '@/lib/api-config';
import type { Course, Chapter } from './definitions';

export interface CourseFilters {
  page?: number;
  limit?: number;
  subject?: string;
  educationalLevel?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BackendService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.BACKEND_URL || 'http://localhost:3007/api';
    this.apiKey = process.env.BACKEND_API_KEY || 'dev-api-key-123';
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
      console.error(`Erro de backend: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Erro de backend: ${response.status} ${response.statusText}. ${errorBody}`);
    }

    // Lida com casos onde a resposta pode estar vazia
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        if (text) {
          // Sometimes the service returns a plain string for errors.
          throw new Error(text);
        }
        return {} as T;
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest(API_CONFIG.BACKEND.ENDPOINTS.HEALTH, 'GET', null, { cache: 'no-store' });
  }

  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${API_CONFIG.BACKEND.ENDPOINTS.COURSES}?${queryString}` : API_CONFIG.BACKEND.ENDPOINTS.COURSES;
    
    return this.makeRequest<PaginatedResponse<Course>>(endpoint, 'GET', null, { cache: 'no-store'});
  }

  async getCourseById(courseId: string): Promise<{ success: boolean; data: Course }> {
    return this.makeRequest<{ success: boolean; data: Course }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.COURSES}/${courseId}`, 'GET', null, { next: { revalidate: 0 } }
    );
  }

  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ success: boolean; data: Course }> {
    return this.makeRequest<{ success: boolean; data: Course }>(
      API_CONFIG.BACKEND.ENDPOINTS.COURSES,
      'POST',
      courseData
    );
  }

  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<{ success: boolean; data: Course }> {
    return this.makeRequest<{ success: boolean; data: Course }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.COURSES}/${courseId}`,
      'PUT',
      courseData
    );
  }
  
  async updateChapter(chapterId: string, chapterData: Partial<Chapter>): Promise<{ success: boolean; data: Chapter }> {
    return this.makeRequest<{ success: boolean; data: Chapter }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.CHAPTERS}/${chapterId}`,
      'PUT',
      chapterData
    );
  }

  async getCourseChapters(courseId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.COURSES}/${courseId}/chapters`
    );
  }

  async getChapterById(chapterId: string): Promise<{ success: boolean; data: Chapter }> {
    return this.makeRequest<{ success: boolean; data: Chapter }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.CHAPTERS}/${chapterId}`
    );
  }

  async getChapterSections(chapterId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.CHAPTERS}/${chapterId}/sections`
    );
  }

  async getChapterActivities(chapterId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.CHAPTERS}/${chapterId}/activities`
    );
  }

  async getChapterAssessments(chapterId: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `${API_CONFIG.BACKEND.ENDPOINTS.CHAPTERS}/${chapterId}/assessments`
    );
  }
}

export const backendService = new BackendService();
