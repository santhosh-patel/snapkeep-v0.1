import { FolderOpen, MessageCircle, Settings, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onUploadClick: () => void;
}

export function BottomNav({ onUploadClick }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/browse', icon: FolderOpen, label: 'Browse' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-glass safe-area-bottom z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {/* Browse Tab */}
        <button
          onClick={() => navigate('/browse')}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
            location.pathname === '/browse' 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="w-6 h-6" />
          <span className="text-xs font-medium">Browse</span>
        </button>

        {/* Upload Button - Center */}
        <button
          onClick={onUploadClick}
          className="relative -mt-8 flex items-center justify-center w-16 h-16 rounded-full upload-button-gradient shadow-glow active:scale-95 transition-transform duration-200"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>

        {/* Chat Tab */}
        <button
          onClick={() => navigate('/chat')}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
            location.pathname === '/chat' 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Chat</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
            location.pathname === '/settings' 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
