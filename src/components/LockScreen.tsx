import { Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export function LockScreen() {
  const { unlockApp } = useApp();

  const handleUnlock = () => {
    // In a real app, this would trigger biometric authentication
    // For demo purposes, we'll just unlock
    unlockApp();
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-20 h-20 rounded-3xl upload-button-gradient flex items-center justify-center shadow-glow animate-float">
          <ShieldCheck className="w-10 h-10 text-primary-foreground" />
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-bold mb-2">SnapKeep</h1>
      <p className="text-muted-foreground text-center mb-12">
        Your files are protected
      </p>

      {/* Unlock Button */}
      <Button
        onClick={handleUnlock}
        variant="default"
        size="lg"
        className="gap-3"
      >
        <Fingerprint className="w-5 h-5" />
        Unlock with Biometrics
      </Button>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Use Face ID or Touch ID to access your files
      </p>
    </div>
  );
}
