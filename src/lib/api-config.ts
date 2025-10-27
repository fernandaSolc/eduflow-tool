export const API_CONFIG = {
  AI_SERVICE: {
    BASE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://aiservice.eduflow.pro',
    API_KEY: process.env.AI_SERVICE_API_KEY || 'test-api-key-123',
    ENDPOINTS: {
      HEALTH: '/v1/health',
      BACKEND_STATUS: '/v1/incremental/backend-status',
      CREATE_CHAPTER: '/v1/incremental/create-chapter',
      CONTINUE_CHAPTER: '/v1/incremental/continue-chapter',
      GET_CHAPTER: '/v1/incremental/chapter',
      GET_COURSE_CHAPTERS: '/v1/incremental/course',
      METRICS: '/v1/metrics'
    }
  },
  BACKEND: {
    BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    API_KEY: process.env.BACKEND_API_KEY,
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
