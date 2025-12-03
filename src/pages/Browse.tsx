import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Star, Image, FileText, File, Camera, X, Sparkles, MoreVertical, Trash2, Share2, FolderInput, CheckCircle2, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { tagConfigs, DocumentTag } from '@/utils/autoTag';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type FileCategory = 'image' | 'screenshot' | 'pdf' | 'document' | 'other';
type SortField = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

const categoryConfig: Record<FileCategory, { label: string; icon: React.ElementType; color: string }> = {
  image: { label: 'Images', icon: Image, color: 'text-blue-500 bg-blue-500/10' },
  screenshot: { label: 'Screenshots', icon: Camera, color: 'text-purple-500 bg-purple-500/10' },
  pdf: { label: 'PDFs', icon: FileText, color: 'text-red-500 bg-red-500/10' },
  document: { label: 'Documents', icon: File, color: 'text-green-500 bg-green-500/10' },
  other: { label: 'Other', icon: FileText, color: 'text-gray-500 bg-gray-500/10' },
};

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'date', label: 'Date' },
  { field: 'size', label: 'Size' },
  { field: 'type', label: 'Type' },
];

export default function Browse() {
  const { files, naturalLanguageSearch, settings, removeFile, updateFile, addTimelineEvent } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<FileCategory>>(
    new Set(['image', 'screenshot', 'pdf', 'document', 'other'])
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const filteredFiles = useMemo(() => {
    let result = searchQuery.trim() ? naturalLanguageSearch(searchQuery) : files;
    
    // Apply sorting
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [searchQuery, files, naturalLanguageSearch, sortField, sortOrder]);

  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const category = file.type as FileCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<FileCategory, typeof files>);

  const toggleCategory = (category: FileCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Long press handlers
  const handleTouchStart = useCallback((fileId: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedFiles(new Set([fileId]));
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const toggleFileSelection = (fileId: string) => {
    if (isSelectionMode) {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(fileId)) {
          next.delete(fileId);
          if (next.size === 0) setIsSelectionMode(false);
        } else {
          next.add(fileId);
        }
        return next;
      });
    }
  };

  const handleFileClick = (fileId: string) => {
    if (isSelectionMode) {
      toggleFileSelection(fileId);
    } else {
      navigate(`/preview/${fileId}`);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedFiles(new Set());
  };

  const selectAll = () => {
    const allIds = new Set(filteredFiles.map(f => f.id));
    setSelectedFiles(allIds);
  };

  // Actions
  const handleDelete = () => {
    const count = selectedFiles.size;
    selectedFiles.forEach(id => {
      removeFile(id);
      addTimelineEvent({
        type: 'file_delete',
        title: 'File Deleted',
        description: `Deleted file`,
        fileId: id,
      });
    });
    toast({
      title: "Files deleted",
      description: `${count} file${count > 1 ? 's' : ''} deleted successfully.`,
    });
    cancelSelection();
  };

  const handleShare = async () => {
    const selectedFilesList = files.filter(f => selectedFiles.has(f.id));
    
    if (navigator.share && selectedFilesList.length === 1) {
      const file = selectedFilesList[0];
      try {
        await navigator.share({
          title: file.name,
          text: `Check out this file: ${file.name}`,
        });
        toast({ title: "Shared successfully" });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast({ title: "Sharing failed", variant: "destructive" });
        }
      }
    } else {
      toast({
        title: "Share",
        description: `${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''} ready to share.`,
      });
    }
    cancelSelection();
  };

  const handleMove = (targetCategory: FileCategory) => {
    selectedFiles.forEach(id => {
      updateFile(id, { type: targetCategory });
    });
    toast({
      title: "Files moved",
      description: `Moved to ${categoryConfig[targetCategory].label}`,
    });
    setShowMoveSheet(false);
    cancelSelection();
  };

  const handleMenuAction = (action: 'delete' | 'share' | 'move', fileId: string) => {
    setActiveMenu(null);
    setSelectedFiles(new Set([fileId]));
    setIsSelectionMode(true);
    
    if (action === 'delete') {
      removeFile(fileId);
      addTimelineEvent({
        type: 'file_delete',
        title: 'File Deleted',
        description: `Deleted file`,
        fileId,
      });
      toast({ title: "File deleted" });
      cancelSelection();
    } else if (action === 'share') {
      const file = files.find(f => f.id === fileId);
      if (file && navigator.share) {
        navigator.share({ title: file.name, text: `Check out: ${file.name}` });
      } else {
        toast({ title: "Share", description: "File ready to share" });
      }
      cancelSelection();
    } else if (action === 'move') {
      setShowMoveSheet(true);
    }
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setShowSortSheet(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-border">
        {isSelectionMode ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={cancelSelection} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
              <span className="font-semibold">{selectedFiles.size} selected</span>
            </div>
            <button onClick={selectAll} className="text-sm text-primary font-medium">
              Select All
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Browse</h1>
              <button
                onClick={() => setShowSortSheet(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium touch-feedback"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOptions.find(s => s.field === sortField)?.label}
                {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Selection Action Bar */}
      {isSelectionMode && selectedFiles.size > 0 && (
        <div className="fixed bottom-24 left-4 right-4 bg-card rounded-2xl shadow-lg border border-border p-3 z-[60] animate-slide-up">
          <div className="flex items-center justify-around">
            <button
              onClick={handleDelete}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-destructive/10 transition-colors touch-feedback"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="text-xs font-medium text-destructive">Delete</span>
            </button>
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-primary/10 transition-colors touch-feedback"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Share</span>
            </button>
            <button
              onClick={() => setShowMoveSheet(true)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-primary/10 transition-colors touch-feedback"
            >
              <FolderInput className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Move</span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4" onClick={() => { setShowSuggestions(false); setActiveMenu(null); }}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Tap the + button below to upload or capture your first document.
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No results</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Try a different search term
            </p>
          </div>
        ) : (
          Object.entries(categoryConfig).map(([category, config]) => {
            const categoryFiles = groupedFiles[category as FileCategory] || [];
            if (categoryFiles.length === 0) return null;

            const Icon = config.icon;
            const isExpanded = expandedCategories.has(category as FileCategory);

            return (
              <div key={category} className="card-elevated overflow-hidden">
                <button
                  onClick={() => toggleCategory(category as FileCategory)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors touch-feedback"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{categoryFiles.length} files</p>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {categoryFiles.map((file) => {
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <div
                          key={file.id}
                          className={cn(
                            "relative flex items-center gap-3 p-4 border-b border-border last:border-b-0 transition-colors",
                            isSelected ? "bg-primary/10" : "hover:bg-secondary/50"
                          )}
                          onTouchStart={() => handleTouchStart(file.id)}
                          onTouchEnd={handleTouchEnd}
                          onMouseDown={() => handleTouchStart(file.id)}
                          onMouseUp={handleTouchEnd}
                          onMouseLeave={handleTouchEnd}
                        >
                          {/* Selection Checkbox */}
                          {isSelectionMode && (
                            <button
                              onClick={() => toggleFileSelection(file.id)}
                              className="flex-shrink-0"
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                              )}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                              </div>
                            </button>
                          )}

                          {/* File Content */}
                          <button
                            onClick={() => handleFileClick(file.id)}
                            className="flex-1 flex items-center gap-3 text-left touch-feedback"
                          >
                            <div className={cn(
                              "w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative",
                              settings.blurPreviews && "blur-sensitive"
                            )}>
                              {file.thumbnail && !settings.hideThumbnails ? (
                                <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                              ) : file.uri && file.type === 'pdf' ? (
                                <div className="w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                                  <FileText className="w-6 h-6 text-red-500" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              {file.isImportant && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                  <Star className="w-3 h-3 text-white fill-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {file.metadata.date} • {formatFileSize(file.size)}
                                </span>
                              </div>
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {file.tags.slice(0, 2).map((tag) => {
                                    const tagConfig = tagConfigs[tag as DocumentTag];
                                    return (
                                      <span key={tag} className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium", tagConfig?.bgColor, tagConfig?.color)}>
                                        {tagConfig?.label || tag}
                                      </span>
                                    );
                                  })}
                                  {file.tags.length > 2 && <span className="text-xs text-muted-foreground">+{file.tags.length - 2}</span>}
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Three Dot Menu */}
                          {!isSelectionMode && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === file.id ? null : file.id);
                                }}
                                className="p-2 rounded-full hover:bg-secondary transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-muted-foreground" />
                              </button>

                              {activeMenu === file.id && (
                                <div
                                  className="absolute right-0 top-10 bg-card rounded-xl shadow-lg border border-border py-2 min-w-[140px] z-50 animate-scale-in"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleMenuAction('share', file.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-sm">Share</span>
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('move', file.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
                                  >
                                    <FolderInput className="w-4 h-4" />
                                    <span className="text-sm">Move</span>
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('delete', file.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm">Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sort Sheet */}
      {showSortSheet && (
        <>
          <div
            className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
            onClick={() => setShowSortSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Sort By</h2>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.field}
                    onClick={() => handleSortChange(option.field)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-colors touch-feedback",
                      sortField === option.field ? "bg-primary/10 border-2 border-primary" : "bg-secondary border-2 border-transparent"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    {sortField === option.field && (
                      <div className="flex items-center gap-2">
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-primary" /> : <SortDesc className="w-4 h-4 text-primary" />}
                        <span className="text-sm text-primary">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Move Sheet */}
      {showMoveSheet && (
        <>
          <div
            className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
            onClick={() => { setShowMoveSheet(false); cancelSelection(); }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Move to Category</h2>
              <div className="space-y-2">
                {Object.entries(categoryConfig).map(([cat, config]) => {
                  const CatIcon = config.icon;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleMove(cat as FileCategory)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors touch-feedback"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.color)}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
