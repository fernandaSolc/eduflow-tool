export const API_CONFIG = {
  AI_SERVICE: {
    BASE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3005',
    API_KEY: process.env.AI_SERVICE_API_KEY || 'test-api-key-123',
    ENDPOINTS: {
      HEALTH: '/health',
      BACKEND_STATUS: '/incremental/backend-status',
      CREATE_CHAPTER: '/incremental/create-chapter',
      CONTINUE_CHAPTER: '/incremental/continue-chapter',
      GET_CHAPTER: '/incremental/chapter',
      GET_COURSE_CHAPTERS: '/incremental/course'
    }
  },
  BACKEND: {
    BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3007/api',
    API_KEY: process.env.BACKEND_API_KEY || 'dev-api-key-123',
    ENDPOINTS: {
      HEALTH: '/health',
      COURSES: '/courses',
      CHAPTERS: '/chapters',
      CHAPTER_SECTIONS: '/chapters',
      CHAPTER_ACTIVITIES: '/chapters',
      CHAPTER_ASSESSMENTS: '/chapters'
    }
  }
};
