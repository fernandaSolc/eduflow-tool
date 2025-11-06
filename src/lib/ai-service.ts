import { API_CONFIG } from '@/lib/api-config';
import type { Chapter } from './definitions';

export interface CreateChapterRequest {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  // Quando isIntroduction=true: chapterOutlines (array) é obrigatório
  chapterOutlines?: Array<{
    number: number;
    title: string;
    description: string;
    wordCount: number;
    order?: number; // Campo order opcional mas recomendado
  }>;
  // Quando isIntroduction=false: chapterOutline (singular) é obrigatório
  chapterOutline?: {
    number: number;
    title: string;
    description: string;
    wordCount: number;
    order?: number;
  };
  subject: string;
  educationalLevel: string;
  targetAudience: string;
  template: string;
  subchapterTemplate?: {
    structure: string;
    minSubchapters?: number;
    maxSubchapters?: number;
    wordCountPerSubchapter?: number;
  };
  philosophy: string;
  bibliography?: Array<{
    title: string;
    author?: string;
    year?: string;
    url?: string;
  }>;
  title?: string;
  prompt?: string;
  chapterNumber?: number;
  isIntroduction?: boolean; // Se é a introdução completa
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

// Requisição para gerar subcapítulo incremental
export interface GenerateSubchapterRequest {
  courseId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterOutline: {
    number: number;
    title: string;
    description: string;
    wordCount: number;
    order?: number; // Campo order opcional para consistência
  };
  subchapterNumber: number; // Número do subcapítulo a ser gerado (sempre numérico)
  existingSubchapters?: Array<{
    number: number;
    title: string;
    content: string;
  }>; // Subcapítulos já gerados para contexto
  courseTitle: string;
  courseDescription: string;
  subject: string;
  educationalLevel: string;
  targetAudience: string;
  template: string;
  subchapterTemplate: {
    structure: string;
    minSubchapters?: number;
    maxSubchapters?: number;
    wordCountPerSubchapter?: number;
  };
  philosophy: string;
  bibliography?: Array<{
    title: string;
    author?: string;
    year?: string;
    url?: string;
  }>;
  introductionContent?: string; // Conteúdo da introdução para contexto
}

export class AIService {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://aiservice.eduflow.pro';
    // ✅ CORRETO: Usar NEXT_PUBLIC_AI_SERVICE_API_KEY para estar disponível no cliente
    this.apiKey = process.env.NEXT_PUBLIC_AI_SERVICE_API_KEY || process.env.AI_SERVICE_API_KEY || 'test-api-key-123';
    // Timeout padrão de 20 minutos (1200000ms) para operações de geração de conteúdo
    // Pode ser configurado via variável de ambiente
    this.timeout = Number(
      process.env.NEXT_PUBLIC_AI_SERVICE_TIMEOUT_MS ||
      process.env.AI_SERVICE_TIMEOUT_MS ||
      20 * 60 * 1000 // 20 minutos
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    options: RequestInit = {},
    customTimeout?: number
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };

    // Usa timeout customizado se fornecido, senão usa o padrão da classe
    const timeoutMs = customTimeout || this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...options,
      method,
      headers,
      signal: controller.signal,
    };

    if (data && method !== 'GET') {
      // Garante que chapterOutlines não tenha campos extras
      if (data.chapterOutlines && Array.isArray(data.chapterOutlines)) {
        data.chapterOutlines = data.chapterOutlines.map((outline: any) => {
          // Retorna apenas os campos necessários
          return {
            number: outline.number,
            title: outline.title,
            description: outline.description,
            wordCount: outline.wordCount,
            order: outline.order,
          };
        });
      }

      // Log para debug: verificar tipos antes de serializar
      if (data.chapterOutlines && Array.isArray(data.chapterOutlines)) {
        console.log('🔍 Antes de JSON.stringify - Verificando tipos:');
        data.chapterOutlines.forEach((outline: any, index: number) => {
          console.log(`  outline[${index}]:`, {
            number: outline.number,
            numberType: typeof outline.number,
            wordCount: outline.wordCount,
            wordCountType: typeof outline.wordCount,
            order: outline.order,
            orderType: typeof outline.order,
          });
        });
      }

      config.body = JSON.stringify(data);

      // Log para debug: verificar JSON serializado (primeiros 500 chars)
      const jsonPreview = config.body.substring(0, 500);
      console.log('📤 JSON serializado (primeiros 500 chars):', jsonPreview);
      if (jsonPreview.includes('"number"')) {
        // Verificar se números aparecem como strings no JSON
        const numberMatches = jsonPreview.match(/"number"\s*:\s*"(\d+)"/g);
        if (numberMatches && numberMatches.length > 0) {
          console.warn('⚠️ ATENÇÃO: Números encontrados como strings no JSON:', numberMatches);
        }
      }
    }

    try {
      const response = await fetch(url, config);

      // Limpa o timeout se a requisição completou
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erro do AI Service: ${response.status} ${response.statusText}`, errorBody);

        // Tratamento específico de erros conforme guia
        let errorMessage = `Erro do AI Service: ${response.status} ${response.statusText}`;

        if (response.status === 401) {
          errorMessage = 'API key inválida. Verifique NEXT_PUBLIC_AI_SERVICE_API_KEY.';
        } else if (response.status === 404) {
          errorMessage = 'Recurso não encontrado. Verifique se o ID existe.';
        } else if (response.status === 503) {
          errorMessage = 'Serviço indisponível. Tente novamente em alguns segundos.';
        } else if (response.status === 400) {
          // Erro de validação - mostrar detalhes
          try {
            const errorData = JSON.parse(errorBody);
            const messages = Array.isArray(errorData.message)
              ? errorData.message.join(', ')
              : errorData.message || errorBody;
            errorMessage = `Dados inválidos: ${messages}`;
          } catch {
            errorMessage = `Dados inválidos: ${errorBody}`;
          }
        } else {
          errorMessage = `${errorMessage}. ${errorBody}`;
        }

        throw new Error(errorMessage);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return text as any;
      }
    } catch (error: any) {
      // Limpa o timeout em caso de erro
      clearTimeout(timeoutId);

      // Verifica se foi timeout
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        throw new Error(`Timeout: A requisição demorou mais de ${Math.round(timeoutMs / 1000 / 60)} minutos para responder. Tente novamente.`);
      }

      // Re-lança outros erros
      throw error;
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
    // Timeout estendido de 20 minutos para criação de capítulo (geração de conteúdo)
    return this.makeRequest<Chapter>(
      API_CONFIG.AI_SERVICE.ENDPOINTS.CREATE_CHAPTER,
      'POST',
      request,
      {},
      20 * 60 * 1000 // 20 minutos
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

  async getMetrics(): Promise<any> {
    return this.makeRequest(API_CONFIG.AI_SERVICE.ENDPOINTS.METRICS);
  }

  // Gera um subcapítulo incremental
  async generateSubchapter(request: GenerateSubchapterRequest): Promise<Chapter> {
    // Timeout estendido de 20 minutos para geração de subcapítulo (geração de conteúdo)
    return this.makeRequest<Chapter>(
      '/v1/incremental/generate-subchapter',
      'POST',
      request,
      {},
      20 * 60 * 1000 // 20 minutos
    );
  }
}

export const aiService = new AIService();
