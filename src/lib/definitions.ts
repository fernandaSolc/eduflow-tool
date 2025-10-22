export type Course = {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
};

export type Chapter = {
  id:string;
  title: string;
  content: string;
  sections: Section[];
  suggestions: Suggestion[];
};

export type Section = {
    id: string;
    title: string;
}

export type Suggestion = {
    id: string;
    text: string;
}
