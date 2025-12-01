import { 
  Upload, Trash2, Tag, Bell, MessageCircle, Settings, Key, 
  FileText, Calendar 
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const eventIcons: Record<string, React.ElementType> = {
  file_upload: Upload,
  file_delete: Trash2,
  tag_added: Tag,
  reminder_created: Bell,
  question_asked: MessageCircle,
  settings_changed: Settings,
  api_key_updated: Key,
};

const eventColors: Record<string, string> = {
  file_upload: 'bg-green-500',
  file_delete: 'bg-red-500',
  tag_added: 'bg-blue-500',
  reminder_created: 'bg-amber-500',
  question_asked: 'bg-purple-500',
  settings_changed: 'bg-slate-500',
  api_key_updated: 'bg-cyan-500',
};

export default function Timeline() {
  const { timeline } = useApp();
  const navigate = useNavigate();

  const getDateGroup = (timestamp: string) => {
    const date = parseISO(timestamp);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group events by date
  const groupedEvents = timeline.reduce((acc, event) => {
    const group = getDateGroup(event.timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(event);
    return acc;
  }, {} as Record<string, typeof timeline>);

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-1">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Your recent activity and events
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your activity will appear here as you use SnapKeep.
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, events]) => (
            <div key={date} className="mb-6">
              {/* Date Header */}
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                {date}
              </h3>

              {/* Events */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {events.map((event, index) => {
                  const Icon = eventIcons[event.type] || FileText;
                  const color = eventColors[event.type] || 'bg-gray-500';

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "relative flex gap-4 pb-6",
                        index === events.length - 1 && "pb-0"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "relative z-10 w-8 h-8 rounded-full flex items-center justify-center",
                        color
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>

                      {/* Content */}
                      <div 
                        className={cn(
                          "flex-1 card-elevated p-3 cursor-pointer hover:bg-secondary/50 transition-colors",
                          event.fileId && "cursor-pointer"
                        )}
                        onClick={() => event.fileId && navigate(`/preview/${event.fileId}`)}
                      >
                        <p className="font-medium text-sm mb-0.5">{event.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
