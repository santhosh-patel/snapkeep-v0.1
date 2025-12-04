import { FolderOpen, MessageCircle, Settings, Plus, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { isPast, parseISO } from 'date-fns';
interface BottomNavProps {
  onUploadClick: () => void;
}
export function BottomNav({
  onUploadClick
}: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    reminders
  } = useApp();
  const overdueCount = reminders.filter(r => isPast(parseISO(r.date)) && !r.isCompleted).length;
  const pendingCount = reminders.filter(r => !r.isCompleted).length;
  const tabs = [{
    path: '/browse',
    icon: FolderOpen,
    label: 'Browse'
  }, {
    path: '/planner',
    icon: Sparkles,
    label: 'Planner',
    badge: overdueCount > 0 ? overdueCount : undefined
  }, {
    path: '/chat',
    icon: MessageCircle,
    label: 'Chat'
  }, {
    path: '/settings',
    icon: Settings,
    label: 'Settings'
  }];
  return <nav className="fixed bottom-0 left-0 right-0 nav-glass safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.slice(0, 2).map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return <button key={tab.path} onClick={() => navigate(tab.path)} className={cn("flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 touch-feedback relative", isActive ? "text-primary bg-primary/10" : "text-muted-foreground")}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.badge && <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>}
            </button>;
      })}

        {/* Upload Button */}
        <button onClick={onUploadClick} className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full upload-button-gradient shadow-glow active:scale-95 transition-transform duration-200">
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>

        {tabs.slice(2).map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return <button key={tab.path} onClick={() => navigate(tab.path)} className={cn("flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 touch-feedback", isActive ? "text-primary bg-primary/10" : "text-muted-foreground")}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>;
      })}
      </div>
    </nav>;
}