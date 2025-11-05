/**
 * AI Service Client - Cliente otimizado para integração com editor rico
 */

export interface TransformRequest {
  chapterId: string;
  continueType: 'expand' | 'simplify' | 'exemplify' | 'assess' | 'add_section' | 'add_activities' | 'add_assessments';
  selectedText: string;
  additionalContext?: string;
}

export interface TransformResponse {
  id: string;
  courseId: string;
  chapterNumber: number;
  title: string;
  content: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    orderIndex: number;
    activities?: any[];
    questions?: any[];
  }>;
  status: 'generated' | 'draft' | 'edited' | 'completed';
  createdAt: string;
  updatedAt: string;
  metrics: {
    readabilityScore: number;
    durationMin: number;
    coverage: number;
  };
  suggestions: string[];
  canContinue: boolean;
  availableContinueTypes: string[];
}

export class AIServiceClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://aiservice.eduflow.pro';
    this.apiKey = process.env.AI_SERVICE_API_KEY || 'test-api-key-123';
    this.timeout = Number(process.env.NEXT_PUBLIC_AI_SERVICE_TIMEOUT_MS || process.env.AI_SERVICE_TIMEOUT_MS || 15 * 60 * 1000);
  }

  async transformContent(request: TransformRequest): Promise<TransformResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/v1/incremental/continue-chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          chapterId: request.chapterId,
          continueType: request.continueType,
          additionalContext: this.buildContext(request.continueType, request.selectedText, request.additionalContext)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI Service Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: A requisição demorou muito para responder');
      }

      throw error;
    }
  }

  // Books API - via rotas proxy Next.js com timeout estendido
  async generateUniversal(spec: any, options: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);
    try {
      const res = await fetch(`/api/books/universal/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec, options }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha na geração universal (${res.status})`);
      }
      return res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  async generateOutline(spec: any, options: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);
    try {
      const res = await fetch(`/api/books/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec, options }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao gerar outline (${res.status})`);
      }
      return res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  async generateBookChapter(payload: { spec: any; chapter: any; context?: any; options?: any }): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);
    try {
      const res = await fetch(`/api/books/chapter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao gerar capítulo (${res.status})`);
      }
      return res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  async generateFullBook(spec: any, options: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);
    try {
      const res = await fetch(`/api/books/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec, options }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao gerar livro completo (${res.status})`);
      }
      return res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  private buildContext(type: string, selectedText: string, additionalContext?: string): string {
    const baseContexts = {
      expand: `Expanda o seguinte trecho de texto: "${selectedText}"`,
      simplify: `Simplifique o seguinte trecho de texto: "${selectedText}"`,
      exemplify: `Crie um exemplo prático, uma analogia ou um estudo de caso sobre o seguinte conceito: "${selectedText}"`,
      assess: `Gere uma questão de avaliação (múltipla escolha ou dissertativa) sobre o seguinte trecho: "${selectedText}"`,
      add_section: `Adicione uma nova seção ao capítulo baseada no seguinte contexto: "${selectedText}"`,
      add_activities: `Adicione atividades práticas baseadas no seguinte conteúdo: "${selectedText}"`,
      add_assessments: `Adicione avaliações formativas baseadas no seguinte conteúdo: "${selectedText}"`
    };

    const context = baseContexts[type as keyof typeof baseContexts] || `Transforme o seguinte conteúdo: "${selectedText}"`;

    if (additionalContext) {
      return `${context}\nInstruções adicionais: ${additionalContext}`;
    }

    return context;
  }

  detectContentType(text: string): string[] {
    const isTechnical = /[A-Z]{2,}|[0-9]+%|[a-z]+[A-Z]/.test(text);
    const isComplex = text.length > 200;
    const isAbstract = /conceito|teoria|princípio|filosofia/i.test(text);
    const isShort = text.length < 50;

    if (isTechnical) return ['expand', 'exemplify'];
    if (isComplex) return ['simplify', 'exemplify'];
    if (isAbstract) return ['exemplify', 'assess'];
    if (isShort) return ['expand', 'exemplify'];

    return ['expand', 'simplify', 'exemplify', 'assess'];
  }
}

export const aiServiceClient = new AIServiceClient();

export const getActionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    expand: '📈',
    simplify: '🎯',
    exemplify: '💡',
    assess: '❓',
    add_section: '➕',
    add_activities: '🎯',
    add_assessments: '📝'
  };
  return icons[type] || '🤖';
};

export const getActionLabel = (type: string): string => {
  const labels: Record<string, string> = {
    expand: 'Expandir',
    simplify: 'Simplificar',
    exemplify: 'Exemplificar',
    assess: 'Gerar Questão',
    add_section: 'Adicionar Seção',
    add_activities: 'Adicionar Atividades',
    add_assessments: 'Adicionar Avaliações'
  };
  return labels[type] || 'Transformar';
};

export const getActionDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    expand: 'Adiciona detalhes e profundidade ao conteúdo',
    simplify: 'Torna o texto mais claro e acessível',
    exemplify: 'Cria exemplos práticos e analogias',
    assess: 'Gera questões de avaliação',
    add_section: 'Adiciona nova seção ao capítulo',
    add_activities: 'Cria atividades práticas',
    add_assessments: 'Adiciona avaliações formativas'
  };
  return descriptions[type] || 'Transforma o conteúdo selecionado';
};
