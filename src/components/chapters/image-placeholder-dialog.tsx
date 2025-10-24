'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImagePlus } from 'lucide-react';

type ImagePlaceholderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (description: string) => Promise<void>;
  onClose: () => void;
};

export function ImagePlaceholderDialog({
  open,
  onOpenChange,
  onSubmit,
  onClose,
}: ImagePlaceholderDialogProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description) return;
    setIsSubmitting(true);
    await onSubmit(description);
    setIsSubmitting(false);
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inserir Espaço para Imagem</DialogTitle>
          <DialogDescription>
            Descreva a imagem que você quer que o diagramador insira neste local.
            Esta descrição aparecerá como um placeholder no conteúdo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Um gráfico de pizza mostrando a distribuição de energia renovável por tipo (solar, eólica, hídrica)."
            className="h-32"
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !description}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Inserir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
