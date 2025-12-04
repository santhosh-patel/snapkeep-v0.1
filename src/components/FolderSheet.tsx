import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp, Folder } from '@/contexts/AppContext';
import { Folder as FolderIcon, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const folderColors = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Teal', value: 'bg-teal-500' },
];

interface FolderSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectFolder?: (folderId: string | undefined) => void;
  mode: 'manage' | 'select';
}

export function FolderSheet({ open, onClose, onSelectFolder, mode }: FolderSheetProps) {
  const { folders, addFolder, updateFolder, removeFolder } = useApp();
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(folderColors[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ title: "Please enter a folder name", variant: "destructive" });
      return;
    }
    addFolder({ name: newFolderName.trim(), color: newFolderColor });
    toast({ title: "Folder created" });
    setNewFolderName('');
    setNewFolderColor(folderColors[0].value);
    setShowCreateForm(false);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateFolder(id, { name: editName.trim() });
    setEditingId(null);
    toast({ title: "Folder renamed" });
  };

  const handleDeleteFolder = (id: string) => {
    removeFolder(id);
    toast({ title: "Folder deleted" });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-4">
            {mode === 'manage' ? 'Manage Folders' : 'Move to Folder'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Create New Folder */}
          {showCreateForm ? (
            <div className="mb-4 p-4 bg-secondary rounded-2xl space-y-3">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-background"
              />
              <div className="flex flex-wrap gap-2">
                {folderColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewFolderColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color.value,
                      newFolderColor === color.value && "ring-2 ring-primary ring-offset-2"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} className="flex-1">
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-4 justify-start gap-3 h-14 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Create New Folder</span>
            </Button>
          )}

          {/* No Folder Option (for select mode) */}
          {mode === 'select' && (
            <button
              onClick={() => { onSelectFolder?.(undefined); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors touch-feedback mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium">No Folder (Uncategorized)</span>
            </button>
          )}

          {/* Existing Folders */}
          <div className="space-y-2">
            {folders.length === 0 && !showCreateForm && (
              <p className="text-center text-muted-foreground py-8">
                No folders yet. Create one to organize your files.
              </p>
            )}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", folder.color)}>
                  <FolderIcon className="w-5 h-5 text-white" />
                </div>
                
                {editingId === folder.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-9"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(folder.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => mode === 'select' ? (onSelectFolder?.(folder.id), onClose()) : null}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium">{folder.name}</span>
                    </button>
                    {mode === 'manage' && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditFolder(folder)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteFolder(folder.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
