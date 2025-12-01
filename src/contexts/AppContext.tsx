import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AIProvider = 'openai' | 'gemini' | 'groq';

interface AppSettings {
  aiProvider: AIProvider;
  apiKey: string;
  isOnboarded: boolean;
  darkMode: boolean;
  privacyLockEnabled: boolean;
  isLocked: boolean;
}

interface StoredFile {
  id: string;
  name: string;
  type: 'image' | 'screenshot' | 'pdf' | 'document' | 'other';
  mimeType: string;
  size: number;
  thumbnail?: string;
  extractedText: string;
  metadata: {
    date: string;
    title: string;
    fileType: string;
  };
  createdAt: string;
  uri?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AppContextType {
  settings: AppSettings;
  files: StoredFile[];
  chatMessages: ChatMessage[];
  updateSettings: (updates: Partial<AppSettings>) => void;
  addFile: (file: StoredFile) => void;
  removeFile: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  unlockApp: () => void;
  lockApp: () => void;
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
    localStorage.setItem('snapkeep_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addFile = (file: StoredFile) => {
    setFiles(prev => [file, ...prev]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
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

  return (
    <AppContext.Provider
      value={{
        settings,
        files,
        chatMessages,
        updateSettings,
        addFile,
        removeFile,
        addChatMessage,
        clearChat,
        unlockApp,
        lockApp,
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
