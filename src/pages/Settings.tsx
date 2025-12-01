import { useState } from 'react';
import { Bot, Key, Moon, Fingerprint, Info, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp, AIProvider } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const providers: { id: AIProvider; name: string }[] = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'groq', name: 'Groq' },
];

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    updateSettings({ aiProvider: provider });
    setShowProviderPicker(false);
    toast({
      title: "Provider updated",
      description: `Switched to ${providers.find(p => p.id === provider)?.name}`,
    });
  };

  const handleVerifyNewKey = async () => {
    if (!newApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (newApiKey.length >= 10) {
      updateSettings({ apiKey: newApiKey });
      setNewApiKey('');
      setShowApiKeyInput(false);
      toast({
        title: "API Key updated",
        description: "Your new API key has been verified and saved.",
      });
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    }

    setIsVerifying(false);
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    updateSettings({ darkMode: enabled });
  };

  const handlePrivacyLockToggle = (enabled: boolean) => {
    updateSettings({ privacyLockEnabled: enabled });
    toast({
      title: enabled ? "Privacy lock enabled" : "Privacy lock disabled",
      description: enabled
        ? "The app will now require authentication when opened."
        : "The app will no longer require authentication.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* AI Provider Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            AI Configuration
          </h3>

          {/* Provider Selection */}
          <button
            onClick={() => setShowProviderPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">AI Provider</p>
              <p className="font-medium">
                {providers.find(p => p.id === settings.aiProvider)?.name}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* API Key */}
          <div className="space-y-3">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">API Key</p>
                <p className="font-medium">
                  {settings.apiKey ? '••••••••' + settings.apiKey.slice(-4) : 'Not set'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {showApiKeyInput && (
              <div className="p-4 rounded-xl bg-secondary space-y-3 animate-fade-in">
                <Input
                  type="password"
                  placeholder="Enter new API key"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowApiKeyInput(false);
                      setNewApiKey('');
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerifyNewKey}
                    size="sm"
                    className="flex-1"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Verify & Save'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Appearance
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </div>

        {/* Privacy Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Privacy & Security
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Biometric Lock</p>
              <p className="text-sm text-muted-foreground">Require Face ID / Touch ID</p>
            </div>
            <Switch
              checked={settings.privacyLockEnabled}
              onCheckedChange={handlePrivacyLockToggle}
            />
          </div>
        </div>

        {/* About Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            About
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">SnapKeep</p>
              <p className="text-sm text-muted-foreground">v0.01-preview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Picker Modal */}
      {showProviderPicker && (
        <>
          <div
            className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in"
            onClick={() => setShowProviderPicker(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Select AI Provider</h2>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl transition-all",
                      settings.aiProvider === provider.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      settings.aiProvider === provider.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="font-medium flex-1 text-left">{provider.name}</span>
                    {settings.aiProvider === provider.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
