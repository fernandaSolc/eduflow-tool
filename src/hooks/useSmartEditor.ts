'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { detectContentType, validateSelectedText } from '@/lib/content-utils';
import { transformChapterContent } from '@/lib/actions';

interface UseSmartEditorOptions {
  chapterId: string;
  onContentUpdate?: (newContent: string) => void;
}

export function useSmartEditor({ chapterId, onContentUpdate }: UseSmartEditorOptions) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [contextualActions, setContextualActions] = useState<string[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Selection | null>(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      setSelectedText('');
      setShowToolbar(false);
      setIsValidSelection(false);
      return;
    }

    const text = selection.toString().trim();
    
    if (text.length < 10) {
      setSelectedText('');
      setShowToolbar(false);
      setIsValidSelection(false);
      return;
    }

    const validation = validateSelectedText(text);
    
    if (validation.isValid) {
      setSelectedText(text);
      setIsValidSelection(true);
      
      const actions = detectContentType(text);
      setContextualActions(actions);
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      
      setShowToolbar(true);
      selectionRef.current = selection;
    } else {
      setSelectedText('');
      setShowToolbar(false);
      setIsValidSelection(false);
    }
  }, []);

  const closeToolbar = useCallback(() => {
    setShowToolbar(false);
    setSelectedText('');
    setSelectionPosition(null);
    setIsValidSelection(false);
    setContextualActions([]);
    
    if (selectionRef.current) {
      selectionRef.current.removeAllRanges();
      selectionRef.current = null;
    }
  }, []);

  const applyTransformation = useCallback(async (
    type: string,
    additionalContext?: string
  ) => {
    if (!selectedText || !isValidSelection) return;

    setIsTransforming(true);
    
    try {
      const result = await transformChapterContent(
        chapterId,
        type as any,
        selectedText,
        additionalContext
      );

      if (result.success && onContentUpdate) {
        onContentUpdate(result.data.content);
        closeToolbar();
      }
    } catch (error) {
      console.error('Erro na transformação:', error);
    } finally {
      setIsTransforming(false);
    }
  }, [selectedText, isValidSelection, chapterId, onContentUpdate, closeToolbar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        closeToolbar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeToolbar]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeToolbar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeToolbar]);

  return {
    selectedText,
    selectionPosition,
    showToolbar,
    isValidSelection,
    contextualActions,
    transformContent: applyTransformation,
    isTransforming,
    handleTextSelection,
    closeToolbar,
    editorRef
  };
}
