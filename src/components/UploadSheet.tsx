import { X, Upload, Camera, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useApp, StoredFile } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const { addFile, addTimelineEvent } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getFileType = (mimeType: string, name: string): 'image' | 'screenshot' | 'pdf' | 'document' | 'other' => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) {
      if (name.toLowerCase().includes('screenshot')) return 'screenshot';
      return 'image';
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const processFile = async (file: File) => {
    try {
      // Create thumbnail for images
      let thumbnail: string | undefined;
      let uri: string | undefined;
      
      if (file.type.startsWith('image/')) {
        thumbnail = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uri = thumbnail;
      } else {
        // Store file as data URL for non-images too
        uri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const fileType = getFileType(file.type, file.name);

      const newFile: StoredFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        thumbnail,
        extractedText: '',
        tags: [],
        isImportant: false,
        extractedFields: [],
        metadata: {
          date: new Date().toLocaleDateString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileType: file.type || 'Unknown',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uri,
      };

      addFile(newFile);
      
      addTimelineEvent({
        type: 'file_upload',
        title: 'File Uploaded',
        description: `Uploaded "${file.name}"`,
        fileId: newFile.id,
      });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: `Error processing ${file.name}.`,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      setIsProcessing(true);
      // Process all files
      for (let i = 0; i < fileList.length; i++) {
        await processFile(fileList[i]);
      }
      setIsProcessing(false);
      toast({
        title: fileList.length === 1 ? "File uploaded" : "Files uploaded",
        description: fileList.length === 1 
          ? `${fileList[0].name} has been saved.` 
          : `${fileList.length} files have been saved.`,
      });
      onClose();
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add File</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Saving file...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Upload from storage */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors touch-feedback"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Upload Files</p>
                  <p className="text-sm text-muted-foreground">Select one or multiple files</p>
                </div>
              </button>

              {/* Capture with camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors touch-feedback"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Capture</p>
                  <p className="text-sm text-muted-foreground">Take a photo with camera</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  );
}
