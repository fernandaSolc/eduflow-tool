export type Course = {
  id: string;
  title: string;
  description: string;
  subject: string;
  educationalLevel: string;
  targetAudience: string;
  template: string;
  philosophy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
};

export type Chapter = {
  id: string;
  courseId: string;
  chapterNumber: number;
  title: string;
  content: string;
  sections: ChapterSection[];
  status: string;
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
};

export type ChapterSection = {
  id: string;
  title: string;
  content: string;
  type: 'contextualizando' | 'conectando' | 'aprofundando' | 'praticando' | 'recapitulando' | 'exercitando';
  orderIndex: number;
};


export type Suggestion = {
    id: string;
    text: string;
}
