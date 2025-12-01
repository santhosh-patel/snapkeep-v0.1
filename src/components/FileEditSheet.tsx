import { useState } from 'react';
import { X, Star, Tag, Pencil, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp, StoredFile } from '@/contexts/AppContext';
import { DocumentTag, tagConfigs } from '@/utils/autoTag';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileEditSheetProps {
  isOpen: boolean;
  file: StoredFile | null;
  onClose: () => void;
  onDelete: () => void;
}

export function FileEditSheet({ isOpen, file, onClose, onDelete }: FileEditSheetProps) {
  const { updateFile, addTimelineEvent } = useApp();
  const [editedName, setEditedName] = useState('');
  const [editedTags, setEditedTags] = useState<DocumentTag[]>([]);
  const [isImportant, setIsImportant] = useState(false);

  // Initialize state when file changes
  useState(() => {
    if (file) {
      setEditedName(file.name);
      setEditedTags(file.tags);
      setIsImportant(file.isImportant);
    }
  });

  if (!isOpen || !file) return null;

  const handleSave = () => {
    updateFile(file.id, {
      name: editedName || file.name,
      tags: editedTags,
      isImportant,
    });

    addTimelineEvent({
      type: 'tag_added',
      title: 'File Updated',
      description: `Updated "${editedName || file.name}"`,
      fileId: file.id,
    });

    toast({
      title: "File updated",
      description: "Your changes have been saved.",
    });

    onClose();
  };

  const toggleTag = (tag: DocumentTag) => {
    setEditedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const availableTags: DocumentTag[] = [
    'receipt', 'invoice', 'bill', 'warranty', 'contract', 
    'certificate', 'id_card', 'bank_statement', 'manual', 'note', 'photo'
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Edit File</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              File Name
            </label>
            <div className="relative">
              <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={file.name}
                className="pl-11"
              />
            </div>
          </div>

          {/* Important Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setIsImportant(!isImportant)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                isImportant
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-transparent bg-secondary hover:bg-secondary/80"
              )}
            >
              <Star className={cn(
                "w-5 h-5",
                isImportant ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
              )} />
              <div className="text-left">
                <p className="font-medium">Mark as Important</p>
                <p className="text-sm text-muted-foreground">
                  Highlight this file in your collection
                </p>
              </div>
            </button>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground mb-3 block flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const config = tagConfigs[tag];
                const isSelected = editedTags.includes(tag);
                
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      isSelected
                        ? cn(config.bgColor, config.color, "ring-2 ring-current ring-offset-2 ring-offset-background")
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleSave} size="lg" className="w-full gap-2">
              <Save className="w-5 h-5" />
              Save Changes
            </Button>
            
            <Button
              onClick={onDelete}
              variant="destructive"
              size="lg"
              className="w-full gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete File
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
