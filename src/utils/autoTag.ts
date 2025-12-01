// Auto-tagging utilities

export type DocumentTag = 
  | 'receipt' 
  | 'invoice' 
  | 'bill' 
  | 'manual' 
  | 'id_card' 
  | 'bank_statement' 
  | 'certificate' 
  | 'contract'
  | 'warranty'
  | 'note'
  | 'photo'
  | 'screenshot'
  | 'other';

export interface TagConfig {
  id: DocumentTag;
  label: string;
  color: string;
  bgColor: string;
  keywords: string[];
}

export const tagConfigs: Record<DocumentTag, TagConfig> = {
  receipt: {
    id: 'receipt',
    label: 'Receipt',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    keywords: ['receipt', 'purchase', 'bought', 'store', 'shop', 'thank you for shopping', 'transaction'],
  },
  invoice: {
    id: 'invoice',
    label: 'Invoice',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    keywords: ['invoice', 'bill to', 'payment terms', 'net 30', 'invoice number', 'inv-'],
  },
  bill: {
    id: 'bill',
    label: 'Bill',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    keywords: ['utility', 'bill', 'account number', 'billing period', 'amount due', 'electric', 'gas', 'water', 'phone'],
  },
  manual: {
    id: 'manual',
    label: 'Manual',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    keywords: ['manual', 'instructions', 'user guide', 'setup', 'how to', 'troubleshooting', 'safety'],
  },
  id_card: {
    id: 'id_card',
    label: 'ID Card',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    keywords: ['license', 'identification', 'id card', 'passport', 'dob', 'date of birth', 'expires', 'id number'],
  },
  bank_statement: {
    id: 'bank_statement',
    label: 'Bank Statement',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    keywords: ['bank', 'statement', 'balance', 'deposits', 'withdrawals', 'account', 'transactions'],
  },
  certificate: {
    id: 'certificate',
    label: 'Certificate',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    keywords: ['certificate', 'certifies', 'completed', 'awarded', 'achievement', 'diploma', 'degree'],
  },
  contract: {
    id: 'contract',
    label: 'Contract',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    keywords: ['contract', 'agreement', 'terms', 'parties', 'effective date', 'signature', 'legally binding'],
  },
  warranty: {
    id: 'warranty',
    label: 'Warranty',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    keywords: ['warranty', 'guarantee', 'coverage', 'defects', 'replacement', 'repair', 'warranty period'],
  },
  note: {
    id: 'note',
    label: 'Note',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    keywords: ['note', 'meeting', 'agenda', 'action items', 'todo', 'reminder', 'memo'],
  },
  photo: {
    id: 'photo',
    label: 'Photo',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    keywords: [],
  },
  screenshot: {
    id: 'screenshot',
    label: 'Screenshot',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    keywords: ['screenshot'],
  },
  other: {
    id: 'other',
    label: 'Other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    keywords: [],
  },
};

export function detectTags(text: string, fileName: string, mimeType: string): DocumentTag[] {
  const tags: DocumentTag[] = [];
  const lowerText = text.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // Check for screenshot first
  if (lowerFileName.includes('screenshot') || lowerFileName.includes('screen shot')) {
    tags.push('screenshot');
  }

  // Check for image types
  if (mimeType.startsWith('image/') && !tags.includes('screenshot')) {
    // Check if it's a document image or just a photo
    const hasDocumentKeywords = Object.values(tagConfigs).some(config => 
      config.keywords.some(keyword => lowerText.includes(keyword))
    );
    
    if (!hasDocumentKeywords && lowerText.length < 50) {
      tags.push('photo');
    }
  }

  // Check text for document types
  const tagPriority: DocumentTag[] = [
    'id_card', 'bank_statement', 'warranty', 'certificate', 
    'contract', 'invoice', 'receipt', 'bill', 'manual', 'note'
  ];

  for (const tagId of tagPriority) {
    const config = tagConfigs[tagId];
    const hasKeyword = config.keywords.some(keyword => 
      lowerText.includes(keyword) || lowerFileName.includes(keyword)
    );
    
    if (hasKeyword && !tags.includes(tagId)) {
      tags.push(tagId);
    }
  }

  // If no tags found, mark as other
  if (tags.length === 0) {
    tags.push('other');
  }

  return tags.slice(0, 3); // Max 3 tags
}

export function getPrimaryTag(tags: DocumentTag[]): DocumentTag {
  // Priority order for primary tag
  const priority: DocumentTag[] = [
    'id_card', 'bank_statement', 'warranty', 'certificate', 
    'contract', 'invoice', 'receipt', 'bill', 'manual', 'note',
    'screenshot', 'photo', 'other'
  ];

  for (const tag of priority) {
    if (tags.includes(tag)) {
      return tag;
    }
  }

  return 'other';
}
