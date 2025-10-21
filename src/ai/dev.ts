import { config } from 'dotenv';
config();

import '@/ai/flows/generate-new-chapter-content.ts';
import '@/ai/flows/intelligent-chapter-enrichment.ts';
import '@/ai/flows/expand-existing-chapter-content.ts';