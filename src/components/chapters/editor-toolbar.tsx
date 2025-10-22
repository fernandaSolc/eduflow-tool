'use client';

import { Bot, Pencil, Sparkles, StretchHorizontal, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EditorToolbarProps = {
  selection: string;
  onAction: (action: string, selection: string) => void;
};

export function EditorToolbar({ selection, onAction }: EditorToolbarProps) {
  if (!selection) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 p-2 rounded-lg bg-card border shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
        <Button variant="ghost" size="sm" onClick={() => onAction('edit', selection)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('ai-expand', selection)}>
          <StretchHorizontal className="mr-2 h-4 w-4" />
          Expandir
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('ai-simplify', selection)}>
          <Bot className="mr-2 h-4 w-4" />
          Simplificar com IA
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('voice', selection)}>
          <Mic className="mr-2 h-4 w-4" />
          Editar por Voz
        </Button>
      </div>
    </div>
  );
}
