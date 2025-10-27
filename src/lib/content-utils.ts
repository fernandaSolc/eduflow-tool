/**
 * Utilitários para validação e detecção de conteúdo
 * Funções que rodam no cliente
 */

import { aiServiceClient } from './ai-service-client';

export function validateSelectedText(text: string): { isValid: boolean; error?: string } {
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  if (!cleanText) {
    return { isValid: false, error: 'Nenhum texto selecionado' };
  }
  
  if (cleanText.length < 10) {
    return { isValid: false, error: 'Texto muito curto (mínimo 10 caracteres)' };
  }
  
  if (cleanText.length > 2000) {
    return { isValid: false, error: 'Texto muito longo (máximo 2000 caracteres)' };
  }
  
  return { isValid: true };
}

export function detectContentType(text: string): string[] {
  return aiServiceClient.detectContentType(text);
}
