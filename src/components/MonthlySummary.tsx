import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useApp } from '@/contexts/AppContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, FileText, Receipt, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlySummaryProps {
  open: boolean;
  onClose: () => void;
}

export default function MonthlySummary({ open, onClose }: MonthlySummaryProps) {
  const { bills, files, reminders } = useApp();
  
  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Bills this month
    const monthBills = bills.filter(b => {
      const dueDate = parseISO(b.dueDate);
      return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
    });
    
    const totalDue = monthBills.reduce((sum, b) => sum + b.amount, 0);
    const paidBills = monthBills.filter(b => b.isPaid);
    const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);
    const pendingBills = monthBills.filter(b => !b.isPaid);
    const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
    
    // Files this month
    const monthFiles = files.filter(f => {
      const createdAt = parseISO(f.createdAt);
      return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });
    
    // Reminders this month
    const monthReminders = reminders.filter(r => {
      const date = parseISO(r.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });
    const completedReminders = monthReminders.filter(r => r.isCompleted);
    
    // Bill breakdown by type
    const byType = monthBills.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + b.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalDue,
      totalPaid,
      totalPending,
      paidCount: paidBills.length,
      pendingCount: pendingBills.length,
      filesCount: monthFiles.length,
      remindersCount: monthReminders.length,
      completedReminders: completedReminders.length,
      byType,
    };
  }, [bills, files, reminders]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {format(new Date(), 'MMMM yyyy')} Summary
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(80vh-100px)] pb-8">
          {/* Financial Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Financial Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  ₹{summary.totalPaid.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{summary.paidCount} bills</p>
              </div>
              
              <div className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-xl font-bold text-amber-600">
                  ₹{summary.totalPending.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{summary.pendingCount} bills</p>
              </div>
            </div>

            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground mb-1">Total This Month</p>
              <p className="text-2xl font-bold">₹{summary.totalDue.toLocaleString()}</p>
            </div>
          </div>

          {/* Breakdown by Type */}
          {Object.keys(summary.byType).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                By Category
              </h3>
              <div className="space-y-2">
                {Object.entries(summary.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-semibold">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Activity Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Activity
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="card-elevated p-3 text-center">
                <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{summary.filesCount}</p>
                <p className="text-xs text-muted-foreground">Files Added</p>
              </div>
              
              <div className="card-elevated p-3 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{summary.remindersCount}</p>
                <p className="text-xs text-muted-foreground">Reminders</p>
              </div>
              
              <div className="card-elevated p-3 text-center">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p className="text-lg font-bold">{summary.completedReminders}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
