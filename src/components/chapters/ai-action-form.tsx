'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles } from 'lucide-react';

type AiActionFormProps = {
  title: string;
  selection: string;
  placeholder: string;
  buttonText: string;
  onSubmit: (prompt: string) => Promise<void>;
};

export function AiActionForm({
  title,
  selection,
  placeholder,
  buttonText,
  onSubmit,
}: AiActionFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(prompt);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium leading-none">{title}</h4>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Trecho Selecionado:</p>
        <ScrollArea className="h-24 w-full rounded-md border p-3 text-sm">
          {selection}
        </ScrollArea>
      </div>
      <div className="space-y-2">
        <label htmlFor="ai-prompt" className="text-sm font-medium text-muted-foreground">
          Instruções para a IA (Opcional):
        </label>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="h-24"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </div>
    </form>
  );
}
