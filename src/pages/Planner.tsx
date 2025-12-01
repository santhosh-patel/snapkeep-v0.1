import { useMemo } from 'react';
import { 
  Calendar, AlertTriangle, Clock, TrendingUp, FileText, 
  Bell, ChevronRight, Sparkles, X
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, addDays, parseISO, differenceInDays } from 'date-fns';

export default function Planner() {
  const { files, reminders, suggestions, dismissSuggestion } = useApp();
  const navigate = useNavigate();

  // Generate smart insights
  const insights = useMemo(() => {
    const results: Array<{
      id: string;
      type: 'urgent' | 'warning' | 'info' | 'suggestion';
      icon: React.ElementType;
      title: string;
      description: string;
      action?: () => void;
    }> = [];

    // Overdue reminders
    const overdueReminders = reminders.filter(r => 
      isPast(parseISO(r.date)) && !r.isCompleted
    );
    if (overdueReminders.length > 0) {
      results.push({
        id: 'overdue',
        type: 'urgent',
        icon: AlertTriangle,
        title: `${overdueReminders.length} Overdue Items`,
        description: overdueReminders.map(r => r.fileName).slice(0, 2).join(', ') + (overdueReminders.length > 2 ? '...' : ''),
        action: () => navigate('/reminders'),
      });
    }

    // Due today
    const dueToday = reminders.filter(r => isToday(parseISO(r.date)) && !r.isCompleted);
    if (dueToday.length > 0) {
      results.push({
        id: 'today',
        type: 'warning',
        icon: Clock,
        title: `${dueToday.length} Due Today`,
        description: dueToday.map(r => r.description).slice(0, 2).join(', '),
        action: () => navigate('/reminders'),
      });
    }

    // Due this week
    const dueSoon = reminders.filter(r => {
      const date = parseISO(r.date);
      const daysUntil = differenceInDays(date, new Date());
      return daysUntil > 0 && daysUntil <= 7 && !r.isCompleted;
    });
    if (dueSoon.length > 0) {
      results.push({
        id: 'week',
        type: 'info',
        icon: Calendar,
        title: `${dueSoon.length} Due This Week`,
        description: 'Stay on top of upcoming deadlines',
        action: () => navigate('/reminders'),
      });
    }

    // Warranty expiring soon
    const warrantySoon = reminders.filter(r => {
      if (r.type !== 'warranty_date' || r.isCompleted) return false;
      const daysUntil = differenceInDays(parseISO(r.date), new Date());
      return daysUntil > 0 && daysUntil <= 30;
    });
    if (warrantySoon.length > 0) {
      results.push({
        id: 'warranty',
        type: 'warning',
        icon: Bell,
        title: `${warrantySoon.length} Warranty Expiring Soon`,
        description: 'Review your warranty documents',
        action: () => navigate('/reminders'),
      });
    }

    // Recent uploads insight
    const recentFiles = files.filter(f => {
      const daysAgo = differenceInDays(new Date(), parseISO(f.createdAt));
      return daysAgo <= 7;
    });
    if (recentFiles.length > 0) {
      results.push({
        id: 'recent',
        type: 'info',
        icon: TrendingUp,
        title: `${recentFiles.length} Files This Week`,
        description: 'You\'ve been busy organizing!',
      });
    }

    // Document type breakdown suggestion
    if (files.length >= 5) {
      const receiptCount = files.filter(f => f.tags.includes('receipt')).length;
      if (receiptCount >= 3) {
        results.push({
          id: 'receipts',
          type: 'suggestion',
          icon: Sparkles,
          title: 'Expense Tracking',
          description: `You have ${receiptCount} receipts. Want to see your spending?`,
          action: () => navigate('/chat'),
        });
      }
    }

    return results;
  }, [files, reminders, navigate]);

  // Active suggestions (not dismissed)
  const activeSuggestions = suggestions.filter(s => !s.dismissed);

  const typeColors = {
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    suggestion: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-1">Smart Planner</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered insights and suggestions
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-primary">{files.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {reminders.filter(r => !r.isCompleted).length}
            </p>
            <p className="text-xs text-muted-foreground">Reminders</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {reminders.filter(r => r.isCompleted).length}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Insights
            </h3>
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <button
                  key={insight.id}
                  onClick={insight.action}
                  className="w-full card-elevated p-4 flex items-center gap-4 text-left touch-feedback"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    typeColors[insight.type]
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{insight.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {insight.description}
                    </p>
                  </div>
                  {insight.action && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Smart Suggestions */}
        {activeSuggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Suggestions
            </h3>
            {activeSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="card-elevated p-4 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    {suggestion.action && (
                      <button className="text-sm font-medium text-primary">
                        {suggestion.action}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => dismissSuggestion(suggestion.id)}
                    className="p-1 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {insights.length === 0 && activeSuggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              No urgent items or suggestions right now. Keep adding documents to get smart insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
