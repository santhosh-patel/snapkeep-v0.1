import { useMemo, useState, useEffect } from 'react';
import { 
  Calendar, AlertTriangle, Clock, TrendingUp, FileText, 
  Bell, ChevronRight, Sparkles, X, Plus, Receipt, Download,
  CreditCard, CheckCircle2, Zap, Droplets, Flame, Wifi, Phone,
  Home, Shield, RefreshCw, MoreHorizontal, BarChart3, FolderPlus
} from 'lucide-react';
import { useApp, Bill, BillType } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, addDays, parseISO, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillSheet from '@/components/BillSheet';
import MonthlySummary from '@/components/MonthlySummary';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';

const billTypeIcons: Record<BillType, React.ElementType> = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  internet: Wifi,
  phone: Phone,
  rent: Home,
  emi: CreditCard,
  insurance: Shield,
  subscription: RefreshCw,
  other: MoreHorizontal,
};

export default function Planner() {
  const { 
    files, reminders, bills, suggestions, folders,
    dismissSuggestion, markBillPaid, removeBill,
    initializeSystemFolders, exportData 
  } = useApp();
  const navigate = useNavigate();
  
  const [showBillSheet, setShowBillSheet] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  const [showSummary, setShowSummary] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);

  // Initialize system folders on mount
  useEffect(() => {
    initializeSystemFolders();
  }, []);

  // Bills organized by status
  const billsSummary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const overdue = bills.filter(b => !b.isPaid && isPast(parseISO(b.dueDate)) && !isToday(parseISO(b.dueDate)));
    const dueToday = bills.filter(b => !b.isPaid && isToday(parseISO(b.dueDate)));
    const upcoming = bills.filter(b => {
      if (b.isPaid) return false;
      const dueDate = parseISO(b.dueDate);
      const daysUntil = differenceInDays(dueDate, now);
      return daysUntil > 0 && daysUntil <= 7;
    });
    const thisMonth = bills.filter(b => {
      const dueDate = parseISO(b.dueDate);
      return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
    });
    const paidThisMonth = thisMonth.filter(b => b.isPaid);
    const totalThisMonth = thisMonth.reduce((sum, b) => sum + b.amount, 0);
    const paidAmount = paidThisMonth.reduce((sum, b) => sum + b.amount, 0);
    
    return { overdue, dueToday, upcoming, thisMonth, paidThisMonth, totalThisMonth, paidAmount };
  }, [bills]);

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

    // Overdue bills
    if (billsSummary.overdue.length > 0) {
      const totalOverdue = billsSummary.overdue.reduce((sum, b) => sum + b.amount, 0);
      results.push({
        id: 'overdue-bills',
        type: 'urgent',
        icon: AlertTriangle,
        title: `${billsSummary.overdue.length} Overdue Bills`,
        description: `₹${totalOverdue.toLocaleString()} needs immediate attention`,
      });
    }

    // Due today
    if (billsSummary.dueToday.length > 0) {
      results.push({
        id: 'due-today',
        type: 'warning',
        icon: Clock,
        title: `${billsSummary.dueToday.length} Bills Due Today`,
        description: billsSummary.dueToday.map(b => b.name).slice(0, 2).join(', '),
      });
    }

    // Overdue reminders
    const overdueReminders = reminders.filter(r => 
      isPast(parseISO(r.date)) && !r.isCompleted
    );
    if (overdueReminders.length > 0) {
      results.push({
        id: 'overdue-reminders',
        type: 'urgent',
        icon: AlertTriangle,
        title: `${overdueReminders.length} Overdue Reminders`,
        description: overdueReminders.map(r => r.fileName).slice(0, 2).join(', ') + (overdueReminders.length > 2 ? '...' : ''),
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

    return results;
  }, [files, reminders, billsSummary, navigate]);

  // Active suggestions (not dismissed)
  const activeSuggestions = suggestions.filter(s => !s.dismissed);

  const typeColors = {
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    suggestion: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillSheet(true);
  };

  const handleDeleteBill = (bill: Bill) => {
    setDeleteTarget(bill);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeBill(deleteTarget.id);
      toast.success('Bill deleted');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapkeep-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const systemFolders = folders.filter(f => f.isSystem);

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Smart Planner</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowSummary(true)}>
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Bills, reminders & insights
        </p>
      </div>

      <Tabs defaultValue="bills" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="bills" className="flex-1">Bills & EMI</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bills" className="p-4 space-y-6">
          {/* Monthly Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold">₹{billsSummary.totalThisMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{billsSummary.thisMonth.length} bills</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{billsSummary.paidAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{billsSummary.paidThisMonth.length} bills</p>
            </div>
          </div>

          {/* Overdue Bills */}
          {billsSummary.overdue.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-red-600 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue ({billsSummary.overdue.length})
              </h3>
              {billsSummary.overdue.map(bill => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  onPay={() => { markBillPaid(bill.id); toast.success('Bill marked as paid'); }}
                  onEdit={() => handleEditBill(bill)}
                  onDelete={() => handleDeleteBill(bill)}
                />
              ))}
            </div>
          )}

          {/* Due Today */}
          {billsSummary.dueToday.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-amber-600 uppercase tracking-wide">
                Due Today ({billsSummary.dueToday.length})
              </h3>
              {billsSummary.dueToday.map(bill => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  onPay={() => { markBillPaid(bill.id); toast.success('Bill marked as paid'); }}
                  onEdit={() => handleEditBill(bill)}
                  onDelete={() => handleDeleteBill(bill)}
                />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {billsSummary.upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming This Week ({billsSummary.upcoming.length})
              </h3>
              {billsSummary.upcoming.map(bill => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  onPay={() => { markBillPaid(bill.id); toast.success('Bill marked as paid'); }}
                  onEdit={() => handleEditBill(bill)}
                  onDelete={() => handleDeleteBill(bill)}
                />
              ))}
            </div>
          )}

          {/* All Bills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                All Bills ({bills.length})
              </h3>
              <Button size="sm" onClick={() => { setEditingBill(undefined); setShowBillSheet(true); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Bill
              </Button>
            </div>
            
            {bills.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No bills added yet</p>
                <Button className="mt-4" onClick={() => setShowBillSheet(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Your First Bill
                </Button>
              </div>
            ) : (
              bills.filter(b => !billsSummary.overdue.includes(b) && !billsSummary.dueToday.includes(b) && !billsSummary.upcoming.includes(b))
                .map(bill => (
                  <BillCard 
                    key={bill.id} 
                    bill={bill} 
                    onPay={() => { markBillPaid(bill.id); toast.success('Bill marked as paid'); }}
                    onEdit={() => handleEditBill(bill)}
                    onDelete={() => handleDeleteBill(bill)}
                  />
                ))
            )}
          </div>

          {/* Smart Folders */}
          {systemFolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                Smart Folders
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {systemFolders.map(folder => {
                  const folderFiles = files.filter(f => f.folderId === folder.id);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => navigate('/browse')}
                      className="card-elevated p-4 text-left touch-feedback"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: folder.color + '20' }}
                      >
                        <FileText className="w-5 h-5" style={{ color: folder.color }} />
                      </div>
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{folderFiles.length} files</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="p-4 space-y-6">
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
        </TabsContent>
      </Tabs>

      {/* Bill Sheet */}
      <BillSheet 
        open={showBillSheet} 
        onClose={() => { setShowBillSheet(false); setEditingBill(undefined); }}
        editBill={editingBill}
      />

      {/* Monthly Summary */}
      <MonthlySummary open={showSummary} onClose={() => setShowSummary(false)} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemCount={1}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}

// Bill Card Component
function BillCard({ 
  bill, 
  onPay, 
  onEdit, 
  onDelete 
}: { 
  bill: Bill; 
  onPay: () => void; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = billTypeIcons[bill.type];
  const isOverdue = !bill.isPaid && isPast(parseISO(bill.dueDate)) && !isToday(parseISO(bill.dueDate));
  const isDueToday = !bill.isPaid && isToday(parseISO(bill.dueDate));
  
  return (
    <div className={cn(
      "card-elevated p-4",
      isOverdue && "border-l-4 border-l-red-500",
      isDueToday && "border-l-4 border-l-amber-500",
      bill.isPaid && "opacity-60"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          bill.isPaid ? "bg-green-100 dark:bg-green-900/30" : "bg-secondary"
        )}>
          {bill.isPaid ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{bill.name}</p>
            {bill.isRecurring && (
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {bill.isPaid ? 'Paid' : `Due ${format(parseISO(bill.dueDate), 'MMM d, yyyy')}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">₹{bill.amount.toLocaleString()}</p>
          {!bill.isPaid && (
            <div className="flex gap-1 mt-1">
              <button
                onClick={onPay}
                className="text-xs text-green-600 font-medium hover:underline"
              >
                Pay
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={onEdit}
                className="text-xs text-primary font-medium hover:underline"
              >
                Edit
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={onDelete}
                className="text-xs text-red-600 font-medium hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
