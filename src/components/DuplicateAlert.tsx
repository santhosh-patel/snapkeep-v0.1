import { AlertTriangle, X, Copy, ArrowRightLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimilarityResult, formatSimilarityPercentage } from '@/utils/similarity';
import { cn } from '@/lib/utils';

interface DuplicateAlertProps {
  isOpen: boolean;
  duplicates: SimilarityResult[];
  newFileName: string;
  onClose: () => void;
  onKeepBoth: () => void;
  onReplace: (fileId: string) => void;
  onSkip: () => void;
}

export function DuplicateAlert({
  isOpen,
  duplicates,
  newFileName,
  onClose,
  onKeepBoth,
  onReplace,
  onSkip,
}: DuplicateAlertProps) {
  if (!isOpen || duplicates.length === 0) return null;

  const topMatch = duplicates[0];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Alert Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
          
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Possible Duplicate</h2>
              <p className="text-sm text-muted-foreground">
                This file appears similar to an existing document.
              </p>
            </div>
          </div>

          {/* Match Info */}
          <div className="p-4 rounded-2xl bg-secondary mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Similarity</span>
              <span className={cn(
                "text-sm font-bold px-2 py-0.5 rounded-full",
                topMatch.matchType === 'exact' && "bg-red-100 text-red-600 dark:bg-red-900/30",
                topMatch.matchType === 'high' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                topMatch.matchType === 'medium' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
              )}>
                {formatSimilarityPercentage(topMatch.score)} match
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">New:</span>
                <span className="font-medium truncate">{newFileName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Existing:</span>
                <span className="font-medium truncate">{topMatch.matchedFile.name}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={onKeepBoth}
              size="lg"
              className="w-full gap-2"
            >
              <Plus className="w-5 h-5" />
              Keep Both Files
            </Button>
            
            <Button
              onClick={() => onReplace(topMatch.matchedFile.id)}
              variant="secondary"
              size="lg"
              className="w-full gap-2"
            >
              <ArrowRightLeft className="w-5 h-5" />
              Replace Existing
            </Button>
            
            <Button
              onClick={onSkip}
              variant="ghost"
              size="lg"
              className="w-full gap-2 text-muted-foreground"
            >
              Skip Upload
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
