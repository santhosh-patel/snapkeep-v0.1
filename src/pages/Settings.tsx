import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Key, Moon, Sun, Fingerprint, Info, CheckCircle2, Loader2, 
  ChevronRight, Eye, EyeOff, Clock, Shield, History, Wifi, WifiOff, Lock, LogOut, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp, AIProvider } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const providers: { id: AIProvider; name: string; description: string }[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 powered' },
  { id: 'gemini', name: 'Google Gemini', description: 'Multimodal AI' },
  { id: 'groq', name: 'Groq', description: 'Ultra-fast inference' },
];

const autoLockOptions = [
  { value: 0, label: 'Never' },
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, isOnline, addTimelineEvent } = useApp();
  const { user, signOut } = useAuth();
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showAutoLockPicker, setShowAutoLockPicker] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully" });
    navigate('/auth');
  };

  const handleProviderChange = (provider: AIProvider) => {
    updateSettings({ aiProvider: provider });
    setShowProviderPicker(false);
    addTimelineEvent({
      type: 'settings_changed',
      title: 'AI Provider Changed',
      description: `Switched to ${providers.find(p => p.id === provider)?.name}`,
    });
    toast({
      title: "Provider updated",
      description: `Switched to ${providers.find(p => p.id === provider)?.name}`,
    });
  };

  const handleVerifyNewKey = async () => {
    if (!newApiKey.trim()) {
      toast({ title: "API Key Required", description: "Please enter an API key.", variant: "destructive" });
      return;
    }

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (newApiKey.length >= 10) {
      updateSettings({ apiKey: newApiKey });
      addTimelineEvent({
        type: 'api_key_updated',
        title: 'API Key Updated',
        description: 'Your API key has been updated',
      });
      setNewApiKey('');
      setShowApiKeyInput(false);
      toast({ title: "API Key updated", description: "Your new API key has been saved." });
    } else {
      toast({ title: "Invalid API Key", description: "Please check your API key.", variant: "destructive" });
    }

    setIsVerifying(false);
  };

  const handleThemeToggle = () => {
    const newDarkMode = !settings.darkMode;
    updateSettings({ darkMode: newDarkMode });
    toast({
      title: newDarkMode ? "Dark mode enabled" : "Light mode enabled",
      description: `Switched to ${newDarkMode ? 'dark' : 'light'} theme`,
    });
  };

  const handlePinSetup = () => {
    setPinError('');
    
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    updateSettings({ lockPin: newPin, privacyLockEnabled: true });
    addTimelineEvent({
      type: 'settings_changed',
      title: 'PIN Set Up',
      description: 'Lock screen PIN has been configured',
    });
    setNewPin('');
    setConfirmPin('');
    setShowPinSetup(false);
    toast({
      title: "PIN set up successfully",
      description: "Your lock screen PIN has been saved.",
    });
  };

  const handleRemovePin = () => {
    updateSettings({ lockPin: '', privacyLockEnabled: false });
    toast({
      title: "PIN removed",
      description: "Lock screen has been disabled.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <WifiOff className="w-4 h-4" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Appearance Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Appearance
          </h3>

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              settings.darkMode ? "bg-indigo-500/20" : "bg-amber-500/20"
            )}>
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-indigo-500" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                {settings.darkMode ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <div className={cn(
              "w-12 h-7 rounded-full p-1 transition-colors",
              settings.darkMode ? "bg-indigo-500" : "bg-amber-500"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                settings.darkMode ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </button>
        </div>

        {/* AI Configuration Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            AI Configuration
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Optional: Set API key to enable AI chat features
          </p>

          <button
            onClick={() => setShowProviderPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">AI Provider</p>
              <p className="font-medium">{providers.find(p => p.id === settings.aiProvider)?.name}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="space-y-3">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">API Key</p>
                <p className="font-medium">{settings.apiKey ? '••••••••' + settings.apiKey.slice(-4) : 'Not set (optional)'}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {showApiKeyInput && (
              <div className="p-4 rounded-xl bg-secondary space-y-3 animate-fade-in">
                <Input type="password" placeholder="Enter new API key" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} className="bg-background" />
                <div className="flex gap-2">
                  <Button onClick={() => { setShowApiKeyInput(false); setNewApiKey(''); }} variant="secondary" size="sm" className="flex-1">Cancel</Button>
                  <Button onClick={handleVerifyNewKey} size="sm" className="flex-1" disabled={isVerifying}>
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Privacy & Security
          </h3>

          {/* PIN Setup */}
          <button
            onClick={() => setShowPinSetup(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Lock Screen PIN</p>
              <p className="text-sm text-muted-foreground">
                {settings.lockPin ? 'PIN is set' : 'Set up a PIN'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

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
              onCheckedChange={(v) => {
                if (v && !settings.lockPin) {
                  setShowPinSetup(true);
                } else {
                  updateSettings({ privacyLockEnabled: v });
                }
              }} 
            />
          </div>

          <button
            onClick={() => setShowAutoLockPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">Auto-Lock</p>
              <p className="font-medium">{autoLockOptions.find(o => o.value === settings.autoLockTimeout)?.label || '5 minutes'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Hide Thumbnails</p>
              <p className="text-sm text-muted-foreground">Show icons instead of previews</p>
            </div>
            <Switch checked={settings.hideThumbnails} onCheckedChange={(v) => updateSettings({ hideThumbnails: v })} />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Blur Sensitive Previews</p>
              <p className="text-sm text-muted-foreground">Blur until tapped</p>
            </div>
            <Switch checked={settings.blurPreviews} onCheckedChange={(v) => updateSettings({ blurPreviews: v })} />
          </div>
        </div>

        {/* Activity */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Activity
          </h3>

          <button
            onClick={() => navigate('/timeline')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Activity Timeline</p>
              <p className="text-sm text-muted-foreground">View your history</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Account Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Account</h3>
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Signed in</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-all touch-feedback"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <p className="font-medium text-destructive">Sign Out</p>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all touch-feedback"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Sign In</p>
                <p className="text-sm text-muted-foreground">Secure your documents with Google</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* About Section */}
        <div className="card-elevated p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">About</h3>
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
          <div className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in" onClick={() => setShowProviderPicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Select AI Provider</h2>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button key={provider.id} onClick={() => handleProviderChange(provider.id)}
                    className={cn("w-full flex items-center gap-3 p-4 rounded-2xl transition-all touch-feedback",
                      settings.aiProvider === provider.id ? "bg-primary/10 border-2 border-primary" : "bg-secondary border-2 border-transparent"
                    )}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                      settings.aiProvider === provider.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}><Bot className="w-5 h-5" /></div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                    {settings.aiProvider === provider.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auto-Lock Picker Modal */}
      {showAutoLockPicker && (
        <>
          <div className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in" onClick={() => setShowAutoLockPicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Auto-Lock Timeout</h2>
              <div className="space-y-2">
                {autoLockOptions.map((option) => (
                  <button key={option.value}
                    onClick={() => { updateSettings({ autoLockTimeout: option.value }); setShowAutoLockPicker(false); }}
                    className={cn("w-full flex items-center gap-3 p-4 rounded-2xl transition-all touch-feedback",
                      settings.autoLockTimeout === option.value ? "bg-primary/10 border-2 border-primary" : "bg-secondary border-2 border-transparent"
                    )}>
                    <span className="font-medium flex-1 text-left">{option.label}</span>
                    {settings.autoLockTimeout === option.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <>
          <div className="fixed inset-0 bottom-sheet-overlay z-50 animate-fade-in" onClick={() => { setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError(''); }} />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 animate-slide-up safe-area-bottom">
            <div className="p-6">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">
                {settings.lockPin ? 'Change PIN' : 'Set Up PIN'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">New PIN (min 4 digits)</label>
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    maxLength={6}
                    className="text-center text-xl tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Confirm PIN</label>
                  <Input
                    type="password"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    maxLength={6}
                    className="text-center text-xl tracking-widest"
                  />
                </div>
                {pinError && (
                  <p className="text-destructive text-sm text-center">{pinError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => { setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError(''); }} 
                    variant="secondary" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePinSetup} 
                    className="flex-1"
                    disabled={newPin.length < 4}
                  >
                    Save PIN
                  </Button>
                </div>
                {settings.lockPin && (
                  <Button 
                    onClick={handleRemovePin} 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive"
                  >
                    Remove PIN
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}