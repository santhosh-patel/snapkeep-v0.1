import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DocumentTag } from '@/utils/autoTag';

export type AIProvider = 'openai' | 'gemini' | 'groq';

interface AppSettings {
  aiProvider: AIProvider;
  apiKey: string;
  isOnboarded: boolean;
  darkMode: boolean;
  privacyLockEnabled: boolean;
  isLocked: boolean;
}

export interface ExtractedField {
  key: string;
  value: string;
  type: 'date' | 'amount' | 'text' | 'number';
}

export interface StoredFile {
  id: string;
  name: string;
  type: 'image' | 'screenshot' | 'pdf' | 'document' | 'other';
  mimeType: string;
  size: number;
  thumbnail?: string;
  extractedText: string;
  tags: DocumentTag[];
  isImportant: boolean;
  extractedFields: ExtractedField[];
  metadata: {
    date: string;
    title: string;
    fileType: string;
  };
  createdAt: string;
  updatedAt: string;
  uri?: string;
}

export interface Reminder {
  id: string;
  fileId: string;
  fileName: string;
  type: 'due_date' | 'renewal_date' | 'warranty_date' | 'expiry_date';
  date: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'file_upload' | 'file_delete' | 'tag_added' | 'reminder_created' | 'question_asked' | 'settings_changed' | 'api_key_updated';
  title: string;
  description: string;
  fileId?: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: Array<{ fileId: string; fileName: string; snippet: string }>;
  timestamp: string;
}

interface AppContextType {
  settings: AppSettings;
  files: StoredFile[];
  reminders: Reminder[];
  timeline: TimelineEvent[];
  chatMessages: ChatMessage[];
  updateSettings: (updates: Partial<AppSettings>) => void;
  addFile: (file: StoredFile) => void;
  updateFile: (id: string, updates: Partial<StoredFile>) => void;
  removeFile: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  unlockApp: () => void;
  lockApp: () => void;
  searchFiles: (query: string) => StoredFile[];
}

const defaultSettings: AppSettings = {
  aiProvider: 'openai',
  apiKey: '',
  isOnboarded: false,
  darkMode: false,
  privacyLockEnabled: false,
  isLocked: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('snapkeep_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, isLocked: parsed.privacyLockEnabled };
    }
    return defaultSettings;
  });

  const [files, setFiles] = useState<StoredFile[]>(() => {
    const stored = localStorage.getItem('snapkeep_files');
    return stored ? JSON.parse(stored) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const stored = localStorage.getItem('snapkeep_reminders');
    return stored ? JSON.parse(stored) : [];
  });

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    const stored = localStorage.getItem('snapkeep_timeline');
    return stored ? JSON.parse(stored) : [];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem('snapkeep_chat');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('snapkeep_settings', JSON.stringify(settings));
    
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('snapkeep_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('snapkeep_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('snapkeep_timeline', JSON.stringify(timeline));
  }, [timeline]);

  useEffect(() => {
    localStorage.setItem('snapkeep_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addFile = (file: StoredFile) => {
    setFiles(prev => [file, ...prev]);
  };

  const updateFile = (id: string, updates: Partial<StoredFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    // Also remove associated reminders
    setReminders(prev => prev.filter(r => r.fileId !== id));
  };

  const addReminder = (reminder: Reminder) => {
    setReminders(prev => [reminder, ...prev]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setTimeline(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const unlockApp = () => {
    setSettings(prev => ({ ...prev, isLocked: false }));
  };

  const lockApp = () => {
    if (settings.privacyLockEnabled) {
      setSettings(prev => ({ ...prev, isLocked: true }));
    }
  };

  const searchFiles = (query: string): StoredFile[] => {
    if (!query.trim()) return files;
    
    const lowerQuery = query.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(lowerQuery) ||
      file.extractedText.toLowerCase().includes(lowerQuery) ||
      file.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      file.extractedFields.some(field => 
        field.value.toLowerCase().includes(lowerQuery) ||
        field.key.toLowerCase().includes(lowerQuery)
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        files,
        reminders,
        timeline,
        chatMessages,
        updateSettings,
        addFile,
        updateFile,
        removeFile,
        addReminder,
        updateReminder,
        removeReminder,
        addTimelineEvent,
        addChatMessage,
        clearChat,
        unlockApp,
        lockApp,
        searchFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
