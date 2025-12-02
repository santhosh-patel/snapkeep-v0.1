import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, FileText, Calendar, Tag, FileType, 
  Pencil, Star, DollarSign, Hash, Download, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { FileEditSheet } from '@/components/FileEditSheet';
import { tagConfigs, DocumentTag } from '@/utils/autoTag';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FilePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { files, removeFile, addTimelineEvent, settings } = useApp();
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const file = files.find(f => f.id === id);

  if (!file) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">File not found</h2>
        <Button onClick={() => navigate('/browse')} variant="ghost">
          Go back to Browse
        </Button>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share && file.uri) {
        // Try to share the actual file
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const fileToShare = new File([blob], file.name, { type: file.mimeType });
        
        await navigator.share({
          title: file.name,
          files: [fileToShare],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: `Check out: ${file.name}`,
        });
      } else {
        toast({
          title: "Share not supported",
          description: "Your browser doesn't support sharing.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Could not share this file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownload = () => {
    if (file.uri) {
      const link = document.createElement('a');
      link.href = file.uri;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download started" });
    }
  };

  const handleOpenExternal = () => {
    if (file.uri) {
      window.open(file.uri, '_blank');
    }
  };

  const handleDelete = () => {
    addTimelineEvent({
      type: 'file_delete',
      title: 'File Deleted',
      description: `Deleted "${file.name}"`,
    });
    
    removeFile(file.id);
    toast({
      title: "File deleted",
      description: `${file.name} has been removed.`,
    });
    navigate('/browse');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'amount': return DollarSign;
      case 'date': return Calendar;
      case 'number': return Hash;
      default: return Tag;
    }
  };

  const isImage = file.type === 'image' || file.type === 'screenshot';
  const isPdf = file.type === 'pdf';

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex items-center gap-3 p-4 border-b border-border">
        <Button
          onClick={() => navigate('/browse')}
          variant="ghost"
          size="iconSm"
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate flex items-center gap-2">
            {file.name}
            {file.isImportant && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </h1>
        </div>
        <Button
          onClick={() => setShowEditSheet(true)}
          variant="ghost"
          size="iconSm"
          className="rounded-full"
        >
          <Pencil className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleShare}
          variant="ghost"
          size="iconSm"
          className="rounded-full"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {/* File Preview */}
        <div className="card-elevated overflow-hidden">
          {isImage && file.uri && (
            <button
              onClick={() => setIsImageExpanded(!isImageExpanded)}
              className="w-full"
            >
              <img
                src={file.uri}
                alt={file.name}
                className={cn(
                  "w-full object-contain bg-muted transition-all",
                  isImageExpanded ? "max-h-[80vh]" : "max-h-64",
                  settings.blurPreviews && "blur-sensitive"
                )}
              />
            </button>
          )}
          
          {isPdf && file.uri && (
            <div className="relative">
              <iframe
                src={file.uri}
                title={file.name}
                className="w-full h-96 border-0"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  onClick={handleOpenExternal}
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </Button>
              </div>
            </div>
          )}

          {!isImage && !isPdf && file.thumbnail && (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full max-h-64 object-contain bg-muted"
            />
          )}

          {!isImage && !isPdf && !file.thumbnail && (
            <div className="h-48 flex items-center justify-center bg-muted">
              <FileText className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {file.tags.map((tag) => {
              const tagConfig = tagConfigs[tag as DocumentTag];
              return (
                <span
                  key={tag}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    tagConfig?.bgColor,
                    tagConfig?.color
                  )}
                >
                  {tagConfig?.label || tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Metadata */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Added</p>
                <p className="font-medium">{file.metadata.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileType className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type & Size</p>
                <p className="font-medium">{file.mimeType} • {formatFileSize(file.size)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Fields */}
        {file.extractedFields && file.extractedFields.length > 0 && (
          <div className="card-elevated p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Extracted Information
            </h3>
            
            <div className="space-y-3">
              {file.extractedFields.map((field, index) => {
                const Icon = getFieldIcon(field.type);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      field.type === 'amount' && "bg-green-100 dark:bg-green-900/30",
                      field.type === 'date' && "bg-blue-100 dark:bg-blue-900/30",
                      field.type !== 'amount' && field.type !== 'date' && "bg-secondary"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        field.type === 'amount' && "text-green-600",
                        field.type === 'date' && "text-blue-600",
                        field.type !== 'amount' && field.type !== 'date' && "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {field.key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-medium">{field.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extracted Text */}
        {file.extractedText && (
          <div className="card-elevated p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Extracted Text
            </h3>
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {file.extractedText}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleDownload} size="lg" variant="secondary" className="flex-1 gap-2">
            <Download className="w-5 h-5" />
            Download
          </Button>
          <Button onClick={handleShare} size="lg" className="flex-1 gap-2">
            <Share2 className="w-5 h-5" />
            Share
          </Button>
        </div>
      </div>

      {/* Edit Sheet */}
      <FileEditSheet
        isOpen={showEditSheet}
        file={file}
        onClose={() => setShowEditSheet(false)}
        onDelete={handleDelete}
      />

      {/* Expanded Image Overlay */}
      {isImageExpanded && isImage && file.uri && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <Button
            onClick={() => setIsImageExpanded(false)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <img
            src={file.uri}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
