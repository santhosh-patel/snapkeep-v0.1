import { X, Upload, Camera, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useApp, StoredFile, Reminder } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { detectTags, getPrimaryTag } from '@/utils/autoTag';
import { extractStructuredData, generateSampleOCR } from '@/utils/extraction';
import { findDuplicates, SimilarityResult } from '@/utils/similarity';
import { DuplicateAlert } from './DuplicateAlert';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const { files, addFile, removeFile, addReminder, addTimelineEvent } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [pendingFile, setPendingFile] = useState<StoredFile | null>(null);
  const [duplicates, setDuplicates] = useState<SimilarityResult[]>([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !showDuplicateAlert) return null;

  const getFileType = (mimeType: string, name: string): 'image' | 'screenshot' | 'pdf' | 'document' | 'other' => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) {
      if (name.toLowerCase().includes('screenshot')) return 'screenshot';
      return 'image';
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const createRemindersFromDates = (file: StoredFile, extractedData: ReturnType<typeof extractStructuredData>) => {
    const reminderTypes = ['due_date', 'renewal_date', 'warranty_date', 'expiry_date'] as const;
    
    extractedData.dates.forEach(dateInfo => {
      if (reminderTypes.includes(dateInfo.type as any)) {
        const reminder: Reminder = {
          id: crypto.randomUUID(),
          fileId: file.id,
          fileName: file.name,
          type: dateInfo.type as Reminder['type'],
          date: new Date(dateInfo.date).toISOString(),
          description: `${dateInfo.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} for ${file.name}`,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        
        addReminder(reminder);
        
        addTimelineEvent({
          type: 'reminder_created',
          title: 'Reminder Created',
          description: `${reminder.type.replace('_', ' ')} reminder for "${file.name}"`,
          fileId: file.id,
        });
      }
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage('Analyzing document...');
    
    try {
      // Create thumbnail for images
      let thumbnail: string | undefined;
      if (file.type.startsWith('image/')) {
        thumbnail = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setProcessingStage('Extracting text with OCR...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Get file type and generate appropriate OCR text
      const fileType = getFileType(file.type, file.name);
      const primaryTagGuess = fileType === 'screenshot' ? 'screenshot' : 'receipt';
      const extractedText = generateSampleOCR(primaryTagGuess, file.name);

      setProcessingStage('Detecting tags...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Auto-detect tags
      const tags = detectTags(extractedText, file.name, file.type);

      setProcessingStage('Extracting structured data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Extract structured data (dates, amounts, fields)
      const extractedData = extractStructuredData(extractedText);

      // Convert to extracted fields
      const extractedFields = [
        ...extractedData.amounts.map(a => ({
          key: a.type,
          value: `$${a.amount.toFixed(2)}`,
          type: 'amount' as const,
        })),
        ...extractedData.dates.map(d => ({
          key: d.type,
          value: d.date,
          type: 'date' as const,
        })),
        ...Object.entries(extractedData.fields).map(([key, value]) => ({
          key,
          value,
          type: 'text' as const,
        })),
      ];

      const newFile: StoredFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        thumbnail,
        extractedText,
        tags,
        isImportant: false,
        extractedFields,
        metadata: {
          date: new Date().toLocaleDateString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileType: file.type || 'Unknown',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProcessingStage('Checking for duplicates...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Check for duplicates
      const existingFiles = files.map(f => ({
        id: f.id,
        name: f.name,
        extractedText: f.extractedText,
      }));
      
      const foundDuplicates = findDuplicates(extractedText, file.name, existingFiles);

      if (foundDuplicates.length > 0 && foundDuplicates[0].score >= 0.5) {
        // Show duplicate alert
        setPendingFile(newFile);
        setDuplicates(foundDuplicates);
        setShowDuplicateAlert(true);
        setIsProcessing(false);
        onClose();
        return;
      }

      // No duplicates, add file directly
      finalizeUpload(newFile, extractedData);
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing your file.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const finalizeUpload = (file: StoredFile, extractedData?: ReturnType<typeof extractStructuredData>) => {
    addFile(file);
    
    // Add timeline event
    addTimelineEvent({
      type: 'file_upload',
      title: 'File Uploaded',
      description: `Uploaded "${file.name}" with tags: ${file.tags.join(', ')}`,
      fileId: file.id,
    });

    // Create reminders from extracted dates
    if (extractedData) {
      createRemindersFromDates(file, extractedData);
    }
    
    toast({
      title: "File uploaded",
      description: `${file.name} has been processed and saved with ${file.tags.length} tag(s).`,
    });
    
    setIsProcessing(false);
    onClose();
  };

  const handleDuplicateKeepBoth = () => {
    if (pendingFile) {
      const extractedData = extractStructuredData(pendingFile.extractedText);
      finalizeUpload(pendingFile, extractedData);
    }
    setShowDuplicateAlert(false);
    setPendingFile(null);
    setDuplicates([]);
  };

  const handleDuplicateReplace = (existingFileId: string) => {
    if (pendingFile) {
      removeFile(existingFileId);
      const extractedData = extractStructuredData(pendingFile.extractedText);
      finalizeUpload(pendingFile, extractedData);
    }
    setShowDuplicateAlert(false);
    setPendingFile(null);
    setDuplicates([]);
  };

  const handleDuplicateSkip = () => {
    setShowDuplicateAlert(false);
    setPendingFile(null);
    setDuplicates([]);
    toast({
      title: "Upload skipped",
      description: "The file was not uploaded.",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <>
      {/* Duplicate Alert */}
      <DuplicateAlert
        isOpen={showDuplicateAlert}
        duplicates={duplicates}
        newFileName={pendingFile?.name || ''}
        onClose={() => setShowDuplicateAlert(false)}
        onKeepBoth={handleDuplicateKeepBoth}
        onReplace={handleDuplicateReplace}
        onSkip={handleDuplicateSkip}
      />

      {isOpen && (
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
                  <p className="text-sm text-muted-foreground">{processingStage}</p>
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
      )}
    </>
  );
}
