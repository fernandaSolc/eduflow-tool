'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  transformChapterContent,
  expandSelectedContent,
  simplifySelectedContent,
  createExampleForContent,
  generateQuestionForContent
} from '@/lib/actions';
import { validateSelectedText, detectContentType } from '@/lib/content-utils';
import { getActionIcon, getActionLabel, getActionDescription } from '@/lib/ai-service-client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SmartEditorToolbarProps {
  selectedText: string;
  chapterId: string;
  onTransform: (type: string, result: any) => void;
  onError: (error: string) => void;
  position?: { x: number; y: number };
  onClose: () => void;
}

export function SmartEditorToolbar({ 
  selectedText, 
  chapterId, 
  onTransform, 
  onError,
  position = { x: 0, y: 0 },
  onClose
}: SmartEditorToolbarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isValidText, setIsValidText] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [contextualActions, setContextualActions] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const validation = validateSelectedText(selectedText);
    setIsValidText(validation.isValid);
    setValidationError(validation.error || '');
    
    if (validation.isValid) {
      const actions = detectContentType(selectedText);
      setContextualActions(actions);
    }
  }, [selectedText]);

  useEffect(() => {
    if (toolbarRef.current && position) {
      const toolbar = toolbarRef.current;
      const rect = toolbar.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y - rect.height - 10;
      
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (y < 0) {
        y = position.y + 20;
      }
      
      toolbar.style.left = `${x}px`;
      toolbar.style.top = `${y}px`;
    }
  }, [position]);

  const handleTransform = async (type: string) => {
    if (!isValidText) {
      onError(validationError);
      return;
    }

    setIsLoading(true);
    setCurrentAction(type);
    
    try {
      let result;
      
      switch (type) {
        case 'expand':
          result = await expandSelectedContent(chapterId, selectedText);
          break;
        case 'simplify':
          result = await simplifySelectedContent(chapterId, selectedText);
          break;
        case 'exemplify':
          result = await createExampleForContent(chapterId, selectedText);
          break;
        case 'assess':
          result = await generateQuestionForContent(chapterId, selectedText);
          break;
        default:
          result = await transformChapterContent(chapterId, type as any, selectedText);
      }
      
      if (result.success) {
        setPreviewData(result.data);
        setShowPreview(true);
      } else {
        onError(result.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao transformar conteúdo';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const handleApply = () => {
    if (previewData) {
      onTransform('apply', previewData);
      setShowPreview(false);
      onClose();
    }
  };

  if (!isValidText) {
    return (
      <div 
        ref={toolbarRef}
        className="fixed z-[1000] bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg"
        style={{ 
          left: position.x,
          top: position.y - 50,
        }}
      >
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <span className="text-base">⚠️</span>
          <span>{validationError}</span>
          <button onClick={onClose} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-[1000] bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[300px] max-w-[500px]"
        style={{ 
          left: position.x,
          top: position.y - 60,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm text-gray-700">Transformar Conteúdo</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
        
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded text-xs">
            <span className="font-medium text-gray-600 block mb-1">Texto selecionado:</span>
            <span className="text-gray-800">
              {selectedText.length > 100 
                ? `${selectedText.substring(0, 100)}...` 
                : selectedText
              }
            </span>
          </div>
          
          <div className="flex gap-1 flex-wrap">
            {contextualActions.map(action => (
              <Button
                key={action}
                onClick={() => handleTransform(action)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className={`text-xs ${currentAction === action ? 'bg-blue-50 border-blue-300' : ''}`}
                title={getActionDescription(action)}
              >
                {isLoading && currentAction === action ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <span className="mr-1">{getActionIcon(action)}</span>
                )}
                {getActionLabel(action)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {showPreview && previewData && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Preview da Transformação</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                <h4 className="font-medium text-gray-700 mb-2">Texto Original:</h4>
                <p className="text-gray-800">{selectedText}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-700 mb-2">Texto Transformado:</h4>
                <div className="text-blue-800" dangerouslySetInnerHTML={{ __html: previewData.content }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancelar</Button>
              <Button onClick={handleApply}>Aplicar Transformação</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
