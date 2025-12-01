import { X, Upload, Camera, FileText, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const { addFile } = useApp();
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

  const simulateOCR = async (file: File): Promise<string> => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sampleTexts = [
      "Invoice #12345\nDate: December 1, 2024\nTotal Amount: $250.00\nPayment Due: December 15, 2024",
      "Meeting Notes\nProject Update Meeting\nAttendees: John, Sarah, Mike\nAction Items:\n- Complete design review\n- Submit final report",
      "Receipt\nStore: Tech Supplies Inc.\nItem: Wireless Mouse\nPrice: $45.99\nTax: $4.14\nTotal: $50.13",
      "Contract Agreement\nParties: ABC Corp and XYZ Ltd\nEffective Date: Jan 1, 2025\nTerms: 12 months",
    ];
    
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const extractedText = await simulateOCR(file);
      const fileType = getFileType(file.type, file.name);
      
      // Create thumbnail for images
      let thumbnail: string | undefined;
      if (file.type.startsWith('image/')) {
        thumbnail = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        thumbnail,
        extractedText,
        metadata: {
          date: new Date().toLocaleDateString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileType: file.type || 'Unknown',
        },
        createdAt: new Date().toISOString(),
      };

      addFile(newFile);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been processed and saved.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing your file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
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
              <p className="text-lg font-medium">Processing file...</p>
              <p className="text-sm text-muted-foreground">Extracting text with OCR</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Upload from storage */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Upload File</p>
                  <p className="text-sm text-muted-foreground">Select from your device</p>
                </div>
              </button>

              {/* Capture with camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
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
