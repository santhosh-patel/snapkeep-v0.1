import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Reference {
  fileId: string;
  fileName: string;
  snippet: string;
}

export default function Chat() {
  const { chatMessages, addChatMessage, clearChat, addTimelineEvent, settings, files } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Multi-document search
  const searchDocuments = (query: string): Reference[] => {
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    const results: Reference[] = [];
    
    for (const file of files) {
      const lowerText = file.extractedText.toLowerCase();
      const relevanceScore = keywords.reduce((score, keyword) => {
        if (lowerText.includes(keyword)) return score + 1;
        if (file.name.toLowerCase().includes(keyword)) return score + 2;
        if (file.tags.some(t => t.toLowerCase().includes(keyword))) return score + 1.5;
        return score;
      }, 0);

      if (relevanceScore > 0) {
        // Extract relevant snippet
        let snippet = '';
        for (const keyword of keywords) {
          const index = lowerText.indexOf(keyword);
          if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(file.extractedText.length, index + keyword.length + 50);
            snippet = '...' + file.extractedText.slice(start, end).trim() + '...';
            break;
          }
        }

        if (!snippet) {
          snippet = file.extractedText.slice(0, 100) + '...';
        }

        results.push({
          fileId: file.id,
          fileName: file.name,
          snippet,
        });
      }
    }

    return results.slice(0, 5); // Top 5 relevant documents
  };

  const generateAIResponse = async (userMessage: string): Promise<{ content: string; references: Reference[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const references = searchDocuments(userMessage);
    const lowerMessage = userMessage.toLowerCase();

    // Generate contextual response based on found documents
    if (references.length === 0) {
      if (files.length === 0) {
        return {
          content: `I don't have any documents to search through yet. Try uploading some files first - I can help you find information across receipts, invoices, contracts, and other documents once they're in your collection.`,
          references: [],
        };
      }
      return {
        content: `I searched through your ${files.length} documents but couldn't find anything matching "${userMessage}". Try being more specific or using different keywords. I can search through file names, tags, and extracted text.`,
        references: [],
      };
    }

    // Build response based on query type and found documents
    let response = '';

    if (lowerMessage.includes('total') || lowerMessage.includes('spend') || lowerMessage.includes('amount') || lowerMessage.includes('how much')) {
      const amounts = files.flatMap(f => f.extractedFields.filter(ef => ef.type === 'amount'));
      if (amounts.length > 0) {
        const total = amounts.reduce((sum, a) => {
          const num = parseFloat(a.value.replace(/[$,]/g, ''));
          return isNaN(num) ? sum : sum + num;
        }, 0);
        response = `Based on ${references.length} relevant documents, I found financial information. The total across these documents is approximately $${total.toFixed(2)}. Here are the specific documents I analyzed:`;
      } else {
        response = `I found ${references.length} documents that might be relevant to your query about amounts. Here's what I found:`;
      }
    } else if (lowerMessage.includes('due') || lowerMessage.includes('deadline') || lowerMessage.includes('expire') || lowerMessage.includes('when')) {
      const dates = files.flatMap(f => f.extractedFields.filter(ef => ef.type === 'date'));
      if (dates.length > 0) {
        response = `I found ${dates.length} date-related entries across your documents. Here are the relevant files that contain date information:`;
      } else {
        response = `I found ${references.length} potentially relevant documents. Here's what I found:`;
      }
    } else if (lowerMessage.includes('receipt') || lowerMessage.includes('invoice') || lowerMessage.includes('bill')) {
      const matchingFiles = files.filter(f => 
        f.tags.some(t => ['receipt', 'invoice', 'bill'].includes(t))
      );
      response = `You have ${matchingFiles.length} documents tagged as receipts, invoices, or bills. Here are the most relevant ones based on your query:`;
    } else if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
      const warrantyFiles = files.filter(f => f.tags.includes('warranty'));
      if (warrantyFiles.length > 0) {
        response = `I found ${warrantyFiles.length} warranty documents. Here's the information I extracted:`;
      } else {
        response = `I searched for warranty information and found ${references.length} potentially relevant documents:`;
      }
    } else {
      response = `I searched across all ${files.length} documents in your collection and found ${references.length} that match your query. Here's what I found:`;
    }

    return { content: response, references };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addChatMessage({ role: 'user', content: userMessage });
    
    addTimelineEvent({
      type: 'question_asked',
      title: 'Question Asked',
      description: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
    });
    
    setIsLoading(true);

    try {
      const { content, references } = await generateAIResponse(userMessage);
      addChatMessage({
        role: 'assistant',
        content,
        references: references.length > 0 ? references : undefined,
      });
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions across {files.length} documents
          </p>
        </div>
        {chatMessages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="ghost"
            size="iconSm"
            className="rounded-full text-muted-foreground"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl upload-button-gradient flex items-center justify-center mb-4 shadow-glow">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Document Q&A</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Ask any question and I'll search across all your documents to find answers.
            </p>
            <div className="space-y-2 w-full max-w-xs">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              {[
                "How much did I spend on receipts?",
                "When does my warranty expire?",
                "Show me all my invoices",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={cn(
                "max-w-[85%] space-y-2",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-secondary-foreground rounded-tl-sm"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                
                {/* References */}
                {message.references && message.references.length > 0 && (
                  <div className="space-y-2 w-full">
                    {message.references.map((ref, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/preview/${ref.fileId}`)}
                        className="w-full text-left p-3 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {ref.fileName}
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {ref.snippet}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Searching documents...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your documents..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
