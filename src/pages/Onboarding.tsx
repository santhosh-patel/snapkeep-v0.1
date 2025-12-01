import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Key, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp, AIProvider } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

type Step = 'welcome' | 'provider' | 'apikey' | 'complete';

const providers: { id: AIProvider; name: string; description: string }[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 powered analysis' },
  { id: 'gemini', name: 'Google Gemini', description: 'Advanced multimodal AI' },
  { id: 'groq', name: 'Groq', description: 'Ultra-fast inference' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateSettings } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyApiKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: "API Key Required", description: "Please enter your API key.", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (apiKey.length >= 10) {
      updateSettings({ aiProvider: selectedProvider, apiKey });
      setStep('complete');
    } else {
      toast({ title: "Invalid API Key", description: "Please check your API key.", variant: "destructive" });
    }
    setIsVerifying(false);
  };

  const completeOnboarding = () => {
    updateSettings({ isOnboarded: true });
    navigate('/browse');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex gap-2 p-6">
        {['welcome', 'provider', 'apikey', 'complete'].map((s, i) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-300",
            ['welcome', 'provider', 'apikey', 'complete'].indexOf(step) >= i ? "bg-primary" : "bg-muted"
          )} />
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6">
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <img src={logoImage} alt="SnapKeep" className="w-24 h-24 mb-8 animate-bounce-soft" />
              <h1 className="text-3xl font-bold mb-4">Welcome to SnapKeep</h1>
              <p className="text-lg text-muted-foreground max-w-xs">
                Capture, organize, and search your documents with AI-powered intelligence.
              </p>
            </div>
            <Button onClick={() => setStep('provider')} size="lg" className="w-full gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {step === 'provider' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Choose AI Provider</h1>
              <p className="text-muted-foreground">Select your preferred AI service.</p>
            </div>
            <div className="flex-1 space-y-3">
              {providers.map((provider) => (
                <button key={provider.id} onClick={() => setSelectedProvider(provider.id)}
                  className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200",
                    selectedProvider === provider.id ? "border-primary bg-primary/5" : "border-transparent bg-secondary"
                  )}>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    selectedProvider === provider.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}><Bot className="w-6 h-6" /></div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                  {selectedProvider === provider.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep('apikey')} size="lg" className="w-full gap-2 mt-6">Continue <ArrowRight className="w-5 h-5" /></Button>
          </div>
        )}

        {step === 'apikey' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Enter API Key</h1>
              <p className="text-muted-foreground">Enter your {providers.find(p => p.id === selectedProvider)?.name} API key.</p>
            </div>
            <div className="flex-1">
              <div className="p-4 rounded-2xl bg-secondary space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Key className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-semibold">{providers.find(p => p.id === selectedProvider)?.name}</p><p className="text-xs text-muted-foreground">API Key</p></div>
                </div>
                <Input type="password" placeholder="sk-xxxx... or AIza..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-background" />
              </div>
              <p className="text-xs text-muted-foreground text-center px-4 mt-4">Your API key is stored locally on your device.</p>
            </div>
            <div className="space-y-3 mt-6">
              <Button onClick={verifyApiKey} size="lg" className="w-full gap-2" disabled={isVerifying}>
                {isVerifying ? <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</> : <>Verify & Continue <ArrowRight className="w-5 h-5" /></>}
              </Button>
              <Button onClick={() => setStep('provider')} variant="ghost" size="lg" className="w-full">Back</Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-bounce-soft">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
            <p className="text-lg text-muted-foreground max-w-xs mb-12">Start capturing and organizing your documents.</p>
            <Button onClick={completeOnboarding} size="lg" className="w-full gap-2">Start Using SnapKeep <ArrowRight className="w-5 h-5" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
