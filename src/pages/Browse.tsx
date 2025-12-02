import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Star, Image, FileText, File, Camera, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { tagConfigs, DocumentTag } from '@/utils/autoTag';
import { cn } from '@/lib/utils';

type FileCategory = 'image' | 'screenshot' | 'pdf' | 'document' | 'other';

const categoryConfig: Record<FileCategory, { label: string; icon: React.ElementType; color: string }> = {
  image: { label: 'Images', icon: Image, color: 'text-blue-500 bg-blue-500/10' },
  screenshot: { label: 'Screenshots', icon: Camera, color: 'text-purple-500 bg-purple-500/10' },
  pdf: { label: 'PDFs', icon: FileText, color: 'text-red-500 bg-red-500/10' },
  document: { label: 'Documents', icon: File, color: 'text-green-500 bg-green-500/10' },
  other: { label: 'Other', icon: FileText, color: 'text-gray-500 bg-gray-500/10' },
};

const searchSuggestions = [
  "Show all receipts",
  "Find invoices from last month",
  "Warranty documents",
  "Bank statements",
  "Documents with subscription",
];

export default function Browse() {
  const { files, naturalLanguageSearch, settings } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<FileCategory>>(
    new Set(['image', 'screenshot', 'pdf', 'document', 'other'])
  );

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    return naturalLanguageSearch(searchQuery);
  }, [searchQuery, files, naturalLanguageSearch]);

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

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">Browse</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search or ask a question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
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

        {/* Search Suggestions */}
        {showSuggestions && !searchQuery && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Try natural language search:
            </p>
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4" onClick={() => setShowSuggestions(false)}>
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
              Try a different search term or use natural language like "receipts from last month"
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
                    {categoryFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => navigate(`/preview/${file.id}`)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 touch-feedback"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative",
                          settings.blurPreviews && "blur-sensitive"
                        )}>
                          {file.thumbnail && !settings.hideThumbnails ? (
                            <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
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

                        <div className="flex-1 min-w-0 text-left">
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

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
