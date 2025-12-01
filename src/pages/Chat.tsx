import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export default function Chat() {
  const { chatMessages, addChatMessage, clearChat, settings, files } = useApp();
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

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response with context from files
    await new Promise(resolve => setTimeout(resolve, 1500));

    const fileContext = files
      .slice(0, 5)
      .map(f => `${f.name}: ${f.extractedText.slice(0, 100)}...`)
      .join('\n');

    // Simulate different responses based on keywords
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('invoice') || lowerMessage.includes('receipt')) {
      return `Based on your documents, I found relevant financial records. You have files containing invoice and receipt information with various amounts and dates. Would you like me to summarize the total expenses?`;
    }

    if (lowerMessage.includes('meeting') || lowerMessage.includes('notes')) {
      return `I can see you have meeting notes in your files. The documents contain action items and attendee information. Would you like me to extract the key action items?`;
    }

    if (lowerMessage.includes('contract') || lowerMessage.includes('agreement')) {
      return `I found contract-related documents in your collection. These contain important terms and dates. Would you like me to highlight the key dates and terms?`;
    }

    if (files.length > 0) {
      return `I have access to ${files.length} documents in your collection. Based on the extracted text, I can help you search for specific information, summarize content, or answer questions about your files. What would you like to know?`;
    }

    return `I'm your AI assistant powered by ${settings.aiProvider}. I can help you search and analyze your documents. Currently, you don't have any files uploaded. Try uploading some documents first, then ask me questions about them!`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addChatMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage);
      addChatMessage({ role: 'assistant', content: response });
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
          <p className="text-sm text-muted-foreground">Ask about your documents</p>
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
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Ask questions about your documents. I can search, summarize, and analyze your files.
            </p>
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
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary text-secondary-foreground rounded-tl-sm"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
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
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
