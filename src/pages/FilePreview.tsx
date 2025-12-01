import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, FileText, Calendar, Tag, FileType, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export default function FilePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { files, removeFile } = useApp();

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
      if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: file.extractedText,
        });
      } else {
        await navigator.clipboard.writeText(file.extractedText);
        toast({
          title: "Copied to clipboard",
          description: "File text has been copied.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDelete = () => {
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
        <h1 className="flex-1 font-semibold truncate">{file.name}</h1>
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
        {/* Thumbnail */}
        {file.thumbnail && (
          <div className="card-elevated overflow-hidden">
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full max-h-64 object-contain bg-muted"
            />
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
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{file.metadata.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{file.metadata.title}</p>
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

        {/* Extracted Text */}
        <div className="card-elevated p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Extracted Text
          </h3>
          <div className="bg-secondary rounded-xl p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {file.extractedText || 'No text extracted from this file.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleShare} size="lg" className="w-full gap-2">
            <Share2 className="w-5 h-5" />
            Open / Share
          </Button>
          <Button
            onClick={handleDelete}
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
  );
}
