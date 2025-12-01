import { useState } from 'react';
import { Bell, Calendar, CheckCircle2, Clock, FileText, ChevronRight, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

type FilterType = 'all' | 'upcoming' | 'overdue' | 'completed';

const reminderTypeLabels: Record<string, string> = {
  due_date: 'Due Date',
  renewal_date: 'Renewal',
  warranty_date: 'Warranty Expires',
  expiry_date: 'Expiry',
};

export default function Reminders() {
  const { reminders, updateReminder } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredReminders = reminders.filter(reminder => {
    const date = parseISO(reminder.date);
    const isOverdue = isPast(date) && !reminder.isCompleted;
    
    switch (filter) {
      case 'upcoming':
        return !isPast(date) && !reminder.isCompleted;
      case 'overdue':
        return isOverdue;
      case 'completed':
        return reminder.isCompleted;
      default:
        return true;
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
  };

  const getDateColor = (dateStr: string, isCompleted: boolean) => {
    if (isCompleted) return 'text-muted-foreground';
    const date = parseISO(dateStr);
    if (isPast(date)) return 'text-destructive';
    if (isToday(date) || isTomorrow(date)) return 'text-amber-600';
    return 'text-foreground';
  };

  const toggleComplete = (id: string, isCompleted: boolean) => {
    updateReminder(id, { isCompleted: !isCompleted });
  };

  const upcomingCount = reminders.filter(r => !isPast(parseISO(r.date)) && !r.isCompleted).length;
  const overdueCount = reminders.filter(r => isPast(parseISO(r.date)) && !r.isCompleted).length;

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-1">Reminders</h1>
        <p className="text-sm text-muted-foreground">
          {upcomingCount} upcoming{overdueCount > 0 && `, ${overdueCount} overdue`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
        {(['all', 'upcoming', 'overdue', 'completed'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No reminders</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {filter === 'all' 
                ? "Reminders will be automatically created when you upload documents with due dates, warranties, or renewals."
                : `No ${filter} reminders found.`}
            </p>
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                "card-elevated p-4 transition-all",
                reminder.isCompleted && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(reminder.id, reminder.isCompleted)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                    reminder.isCompleted
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {reminder.isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {reminderTypeLabels[reminder.type] || reminder.type}
                    </span>
                  </div>
                  <p className={cn(
                    "font-medium mb-1",
                    reminder.isCompleted && "line-through"
                  )}>
                    {reminder.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={cn("flex items-center gap-1", getDateColor(reminder.date, reminder.isCompleted))}>
                      <Calendar className="w-3.5 h-3.5" />
                      {getDateLabel(reminder.date)}
                    </span>
                    <button
                      onClick={() => navigate(`/preview/${reminder.fileId}`)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{reminder.fileName}</span>
                    </button>
                  </div>
                </div>

                {/* Arrow */}
                <button
                  onClick={() => navigate(`/preview/${reminder.fileId}`)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
