import type { Course } from './definitions';

export const courses: Course[] = [
  {
    id: '1',
    title: 'Advanced Frontend Development',
    description: 'Master modern frontend technologies like React, Next.js, and advanced CSS.',
    chapters: [
      {
        id: '1-1',
        title: 'Introduction to Next.js 14',
        content: `
# Welcome to Next.js 14

This chapter provides a comprehensive overview of the latest features in Next.js 14, including the App Router, Server Actions, and improved performance optimizations.

## Key Concepts

- **App Router**: A new paradigm for building applications in Next.js, focusing on layouts and nested routing.
- **Server Components**: Render components on the server, reducing client-side JavaScript and improving load times.
- **Server Actions**: Mutate data on the server without creating API endpoints.

## Getting Started

To start a new Next.js 14 project, run the following command:

\`\`\`bash
npx create-next-app@latest
\`\`\`

This will set up a new project with all the necessary dependencies and configurations.
        `,
        sections: [
          { id: '1-1-1', title: 'Key Concepts' },
          { id: '1-1-2', title: 'Getting Started' },
        ],
        suggestions: [
          { id: '1-1-s1', text: 'Add a section on deploying to Vercel.' },
          { id: '1-1-s2', text: 'Explain the difference between Server and Client Components in more detail.' },
        ],
      },
      {
        id: '1-2',
        title: 'State Management with Zustand',
        content: `
# State Management with Zustand

Zustand is a small, fast, and scalable bearbones state-management solution. It has a comfy API based on hooks.

## Core Principles

- Minimalistic API
- Unopinionated
- No boilerplate

You can create a store with a simple function call.
        `,
        sections: [{ id: '1-2-1', title: 'Core Principles' }],
        suggestions: [],
      },
    ],
  },
  {
    id: '2',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the principles of user interface and user experience design to create intuitive and beautiful products.',
    chapters: [],
  },
  {
    id: '3',
    title: 'Data Science with Python',
    description: 'Dive into data analysis, visualization, and machine learning using Python with libraries like Pandas, and Scikit-learn.',
    chapters: [],
  },
  {
    id: '4',
    title: 'DevOps and Cloud Infrastructure',
    description: 'Understand the practices of DevOps and learn to manage cloud infrastructure on AWS and Google Cloud.',
    chapters: [],
  },
];

export const getCourseById = (id: string): Course | undefined => {
    return courses.find(course => course.id === id);
}

// This is a mock function to simulate updating data. In a real app, this would be a database call.
export function addChapterToCourse(courseId: string, chapter: Course['chapters'][0]) {
  const course = getCourseById(courseId);
  if (course) {
    course.chapters.push(chapter);
  }
}

export function updateChapterContent(courseId: string, chapterId: string, newContent: string) {
  const course = getCourseById(courseId);
  if (course) {
    const chapter = course.chapters.find(c => c.id === chapterId);
    if (chapter) {
      chapter.content = newContent;
    }
  }
}
