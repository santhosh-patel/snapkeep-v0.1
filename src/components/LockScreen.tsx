import { useState } from 'react';
import { Fingerprint, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import logoImage from '@/assets/logo.png';

export function LockScreen() {
  const { unlockApp } = useApp();
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleBiometricUnlock = async () => {
    // Simulate biometric authentication
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      unlockApp();
    } catch (err) {
      setError('Biometric authentication failed');
      setShowPinInput(true);
    }
  };

  const handlePinUnlock = () => {
    if (pin.length >= 4) {
      unlockApp();
    } else {
      setError('PIN must be at least 4 digits');
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 animate-float">
          <img 
            src={logoImage} 
            alt="SnapKeep" 
            className="w-24 h-24"
          />
        </div>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold mb-2">SnapKeep</h1>
        <p className="text-muted-foreground text-center mb-8">
          Your files are protected
        </p>

        {error && (
          <p className="text-destructive text-sm mb-4 animate-fade-in">{error}</p>
        )}

        {showPinInput ? (
          <div className="w-full max-w-xs space-y-4 animate-fade-in">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <Button
              onClick={handlePinUnlock}
              size="lg"
              className="w-full"
              disabled={pin.length < 4}
            >
              Unlock
            </Button>
            <button
              onClick={() => {
                setShowPinInput(false);
                setError('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              Try biometrics again
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-xs">
            <Button
              onClick={handleBiometricUnlock}
              variant="default"
              size="lg"
              className="w-full gap-3"
            >
              <Fingerprint className="w-5 h-5" />
              Unlock with Biometrics
            </Button>

            <button
              onClick={() => setShowPinInput(true)}
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              Use PIN instead
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-xs">
          Use Face ID, Touch ID, or your PIN to access your files
        </p>
      </div>
    </div>
  );
}
