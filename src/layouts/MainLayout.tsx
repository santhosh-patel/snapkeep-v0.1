import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { UploadSheet } from '@/components/UploadSheet';
import { LockScreen } from '@/components/LockScreen';
import { useApp } from '@/contexts/AppContext';

export function MainLayout() {
  const { settings, lockApp } = useApp();
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);

  // Lock app when it goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && settings.privacyLockEnabled) {
        lockApp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.privacyLockEnabled, lockApp]);

  if (settings.isLocked && settings.privacyLockEnabled) {
    return <LockScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <BottomNav onUploadClick={() => setIsUploadSheetOpen(true)} />
      <UploadSheet
        isOpen={isUploadSheetOpen}
        onClose={() => setIsUploadSheetOpen(false)}
      />
    </div>
  );
}
