import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DocumentTag } from '@/utils/autoTag';

export type AIProvider = 'openai' | 'gemini' | 'groq';

interface AppSettings {
  aiProvider: AIProvider;
  apiKey: string;
  isOnboarded: boolean;
  darkMode: boolean;
  privacyLockEnabled: boolean;
  isLocked: boolean;
  hideThumbnails: boolean;
  blurPreviews: boolean;
  autoLockTimeout: number; // minutes, 0 = disabled
  lockPin: string; // User's PIN for lock screen
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
  folderId?: string;
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

export interface SmartSuggestion {
  id: string;
  type: 'reminder' | 'duplicate' | 'action' | 'insight';
  title: string;
  description: string;
  action?: string;
  fileId?: string;
  dismissed: boolean;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  isSystem?: boolean; // For auto-created folders
}

export type BillStatus = 'pending' | 'paid' | 'overdue';
export type BillType = 'electricity' | 'water' | 'gas' | 'internet' | 'phone' | 'rent' | 'emi' | 'insurance' | 'subscription' | 'other';

export interface Bill {
  id: string;
  name: string;
  type: BillType;
  amount: number;
  dueDate: string;
  status: BillStatus;
  isPaid: boolean;
  paidDate?: string;
  isRecurring: boolean;
  recurringDay?: number; // Day of month for recurring bills
  attachedFileIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingAction {
  id: string;
  type: 'upload' | 'delete' | 'update' | 'tag';
  data: any;
  createdAt: string;
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
  folders: Folder[];
  bills: Bill[];
  reminders: Reminder[];
  timeline: TimelineEvent[];
  chatMessages: ChatMessage[];
  suggestions: SmartSuggestion[];
  pendingActions: PendingAction[];
  isOnline: boolean;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addFile: (file: StoredFile) => void;
  updateFile: (id: string, updates: Partial<StoredFile>) => void;
  removeFile: (id: string) => void;
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  removeFolder: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  removeBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  addSuggestion: (suggestion: Omit<SmartSuggestion, 'id' | 'createdAt' | 'dismissed'>) => void;
  dismissSuggestion: (id: string) => void;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'createdAt'>) => void;
  processPendingActions: () => void;
  unlockApp: () => void;
  lockApp: () => void;
  searchFiles: (query: string) => StoredFile[];
  naturalLanguageSearch: (query: string) => StoredFile[];
  initializeSystemFolders: () => void;
  exportData: () => string;
}

const defaultSettings: AppSettings = {
  aiProvider: 'openai',
  apiKey: '',
  isOnboarded: false,
  darkMode: false,
  privacyLockEnabled: false,
  isLocked: false,
  hideThumbnails: false,
  blurPreviews: false,
  autoLockTimeout: 5,
  lockPin: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('snapkeep_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed, isLocked: parsed.privacyLockEnabled };
    }
    return defaultSettings;
  });

  const [files, setFiles] = useState<StoredFile[]>(() => {
    const stored = localStorage.getItem('snapkeep_files');
    return stored ? JSON.parse(stored) : [];
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const stored = localStorage.getItem('snapkeep_folders');
    return stored ? JSON.parse(stored) : [];
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const stored = localStorage.getItem('snapkeep_bills');
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

  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>(() => {
    const stored = localStorage.getItem('snapkeep_suggestions');
    return stored ? JSON.parse(stored) : [];
  });

  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const stored = localStorage.getItem('snapkeep_pending');
    return stored ? JSON.parse(stored) : [];
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (!settings.autoLockTimeout || settings.autoLockTimeout === 0) return;
    
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (settings.privacyLockEnabled) {
          setSettings(prev => ({ ...prev, isLocked: true }));
        }
      }, settings.autoLockTimeout * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [settings.autoLockTimeout, settings.privacyLockEnabled]);

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
    localStorage.setItem('snapkeep_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('snapkeep_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('snapkeep_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('snapkeep_timeline', JSON.stringify(timeline));
  }, [timeline]);

  useEffect(() => {
    localStorage.setItem('snapkeep_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('snapkeep_suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  useEffect(() => {
    localStorage.setItem('snapkeep_pending', JSON.stringify(pendingActions));
  }, [pendingActions]);

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
    setReminders(prev => prev.filter(r => r.fileId !== id));
  };

  const addFolder = (folder: Omit<Folder, 'id' | 'createdAt'>) => {
    const newFolder: Folder = {
      ...folder,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const removeFolder = (id: string) => {
    // Don't allow removing system folders
    const folder = folders.find(f => f.id === id);
    if (folder?.isSystem) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    // Remove folder reference from files
    setFiles(prev => prev.map(f => 
      f.folderId === id ? { ...f, folderId: undefined } : f
    ));
  };

  // System folders initialization
  const systemFolders = [
    { name: 'Bills', color: '#ef4444', isSystem: true },
    { name: 'IDs', color: '#3b82f6', isSystem: true },
    { name: 'Warranty', color: '#22c55e', isSystem: true },
    { name: 'Receipts', color: '#f59e0b', isSystem: true },
  ];

  const initializeSystemFolders = useCallback(() => {
    const existingNames = folders.map(f => f.name);
    const foldersToAdd = systemFolders.filter(sf => !existingNames.includes(sf.name));
    if (foldersToAdd.length > 0) {
      const newFolders = foldersToAdd.map(f => ({
        ...f,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }));
      setFolders(prev => [...newFolders, ...prev]);
    }
  }, [folders]);

  // Bill functions
  const addBill = (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setBills(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
    ));
  };

  const removeBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const markBillPaid = (id: string) => {
    setBills(prev => prev.map(b => 
      b.id === id ? { 
        ...b, 
        isPaid: true, 
        status: 'paid' as BillStatus, 
        paidDate: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      } : b
    ));
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
    setTimeline(prev => [newEvent, ...prev].slice(0, 100));
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

  const addSuggestion = (suggestion: Omit<SmartSuggestion, 'id' | 'createdAt' | 'dismissed'>) => {
    const newSuggestion: SmartSuggestion = {
      ...suggestion,
      id: crypto.randomUUID(),
      dismissed: false,
      createdAt: new Date().toISOString(),
    };
    setSuggestions(prev => [newSuggestion, ...prev].slice(0, 20));
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, dismissed: true } : s));
  };

  const addPendingAction = (action: Omit<PendingAction, 'id' | 'createdAt'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPendingActions(prev => [...prev, newAction]);
  };

  const processPendingActions = useCallback(() => {
    if (!isOnline || pendingActions.length === 0) return;
    // Process queued actions when back online
    setPendingActions([]);
  }, [isOnline, pendingActions]);

  useEffect(() => {
    if (isOnline) processPendingActions();
  }, [isOnline, processPendingActions]);

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
      (file.extractedText && file.extractedText.toLowerCase().includes(lowerQuery)) ||
      (file.tags && file.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
      (file.extractedFields && file.extractedFields.some(field => 
        field.value.toLowerCase().includes(lowerQuery) ||
        field.key.toLowerCase().includes(lowerQuery)
      ))
    );
  };

  // Natural language search
  const naturalLanguageSearch = (query: string): StoredFile[] => {
    const lowerQuery = query.toLowerCase();
    
    // Parse time-based queries
    const timePatterns = [
      { pattern: /last\s+month/i, filter: (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d >= lastMonth;
      }},
      { pattern: /this\s+year|in\s+2024/i, filter: (date: string) => {
        return new Date(date).getFullYear() === new Date().getFullYear();
      }},
      { pattern: /in\s+(\d{4})/i, filter: (date: string, match: RegExpMatchArray) => {
        return new Date(date).getFullYear() === parseInt(match[1]);
      }},
    ];

    // Parse tag-based queries
    const tagPatterns = [
      { pattern: /receipts?/i, tag: 'receipt' },
      { pattern: /invoices?/i, tag: 'invoice' },
      { pattern: /bills?/i, tag: 'bill' },
      { pattern: /warrant(?:y|ies)/i, tag: 'warranty' },
      { pattern: /contracts?|agreements?/i, tag: 'contract' },
      { pattern: /certificates?/i, tag: 'certificate' },
      { pattern: /id\s*cards?|identification/i, tag: 'id_card' },
      { pattern: /bank\s*statements?/i, tag: 'bank_statement' },
    ];

    let results = [...files];

    // Apply time filters
    for (const { pattern, filter } of timePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        results = results.filter(f => filter(f.createdAt, match));
      }
    }

    // Apply tag filters
    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(lowerQuery)) {
        results = results.filter(f => f.tags && f.tags.includes(tag as DocumentTag));
      }
    }

    // Search for specific words
    const wordMatch = lowerQuery.match(/(?:word|containing|with)\s+["']?(\w+)["']?/i);
    if (wordMatch) {
      const word = wordMatch[1].toLowerCase();
      results = results.filter(f => f.extractedText && f.extractedText.toLowerCase().includes(word));
    }

    // If no special patterns, do regular search
    if (results.length === files.length) {
      results = searchFiles(query);
    }

    return results;
  };

  // Export all data as JSON
  const exportData = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      files,
      folders,
      bills,
      reminders,
      timeline,
    };
    return JSON.stringify(data, null, 2);
  }, [files, folders, bills, reminders, timeline]);

  return (
    <AppContext.Provider
      value={{
        settings,
        files,
        folders,
        bills,
        reminders,
        timeline,
        chatMessages,
        suggestions,
        pendingActions,
        isOnline,
        updateSettings,
        addFile,
        updateFile,
        removeFile,
        addFolder,
        updateFolder,
        removeFolder,
        addBill,
        updateBill,
        removeBill,
        markBillPaid,
        addReminder,
        updateReminder,
        removeReminder,
        addTimelineEvent,
        addChatMessage,
        clearChat,
        addSuggestion,
        dismissSuggestion,
        addPendingAction,
        processPendingActions,
        unlockApp,
        lockApp,
        searchFiles,
        initializeSystemFolders,
        exportData,
        naturalLanguageSearch,
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
