export type Course = {
  id: string;
  title: string;
  description: string;
  subject: string;
  educationalLevel?: string;
  targetAudience?: string;
  template: string;
  philosophy: string;
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
  status: string;
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


export type Suggestion = {
    id: string;
    text: string;
}
