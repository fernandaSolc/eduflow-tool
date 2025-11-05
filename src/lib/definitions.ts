// Estrutura para capítulo na ementa
export type ChapterOutline = {
  number: number;
  title: string;
  description: string;
  wordCount: number; // Número de palavras esperado
  order: number;
};

// Template para subcapítulos
export type SubchapterTemplate = {
  structure: string; // Descrição de como devem ser os subcapítulos
  minSubchapters?: number;
  maxSubchapters?: number;
  wordCountPerSubchapter?: number;
};

// Bibliografia
export type BibliographyItem = {
  id: string;
  title: string;
  author?: string;
  year?: string;
  url?: string;
};

export type Course = {
  id: string;
  title: string;
  description: string; // Ementa geral (texto livre)
  chapterOutlines?: ChapterOutline[]; // Estrutura detalhada dos capítulos
  subject: string;
  educationalLevel?: string;
  targetAudience?: string;
  template: string;
  subchapterTemplate?: SubchapterTemplate; // Template para subcapítulos
  philosophy: string;
  bibliography?: BibliographyItem[]; // Títulos da bibliografia
  status: string;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
};

export type Chapter = {
  id: string;
  course_id: string;
  chapter_number: number;
  title: string;
  content: string;
  sections: ChapterSection[];
  subchapters?: Subchapter[]; // Subcapítulos gerados incrementalmente
  currentSubchapterNumber?: number; // Próximo subcapítulo a ser gerado
  isIntroduction?: boolean; // Se é a introdução do curso
  status: 'draft' | 'generating' | 'partial' | 'completed'; // partial = alguns subcapítulos gerados
  created_at: string;
  updated_at: string;
  metrics: {
    readabilityScore: number;
    durationMinutes: number;
    coveragePercentage: number;
    qualityScore: number;
    wordCount: number;
    sectionCompleteness: number;
  };
  suggestions: string[];
  can_continue: boolean;
  available_continue_types: string[];
  workflow_id?: string;
  execution_meta?: any;
};

export type ChapterSection = {
  id: string;
  title: string;
  content: string;
  type: 'contextualizando' | 'conectando' | 'aprofundando' | 'praticando' | 'recapitulando' | 'exercitando';
  orderIndex: number;
  createdAt?: string;
  activities?: any[] | null;
  questions?: any[] | null;
};

// Subcapítulo (seção incremental dentro de um capítulo)
export type Subchapter = {
  id: string;
  chapter_id: string;
  subchapter_number: number; // Número sequencial dentro do capítulo
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'completed' | 'draft';
  created_at: string;
  updated_at: string;
  wordCount?: number;
  orderIndex: number;
};


export type Suggestion = {
    id: string;
    text: string;
}
