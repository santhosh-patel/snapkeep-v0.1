import { FolderOpen, MessageCircle, Settings, Plus, Bell, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { isPast, parseISO } from 'date-fns';

interface BottomNavProps {
  onUploadClick: () => void;
}

export function BottomNav({ onUploadClick }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { reminders } = useApp();

  const overdueCount = reminders.filter(r => isPast(parseISO(r.date)) && !r.isCompleted).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-glass safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        <button
          onClick={() => navigate('/browse')}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200",
            location.pathname === '/browse' ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Browse</span>
        </button>

        <button
          onClick={() => navigate('/reminders')}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 relative",
            location.pathname === '/reminders' ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-medium">Reminders</span>
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={onUploadClick}
          className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full upload-button-gradient shadow-glow active:scale-95 transition-transform duration-200"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>

        <button
          onClick={() => navigate('/chat')}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200",
            location.pathname === '/chat' ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200",
            location.pathname === '/settings' ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
