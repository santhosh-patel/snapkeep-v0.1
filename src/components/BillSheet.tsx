import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApp, Bill, BillType } from '@/contexts/AppContext';
import { Calendar, Receipt, Zap, Droplets, Flame, Wifi, Phone, Home, CreditCard, Shield, RefreshCw, MoreHorizontal } from 'lucide-react';

interface BillSheetProps {
  open: boolean;
  onClose: () => void;
  editBill?: Bill;
}

const billTypes: { value: BillType; label: string; icon: React.ElementType }[] = [
  { value: 'electricity', label: 'Electricity', icon: Zap },
  { value: 'water', label: 'Water', icon: Droplets },
  { value: 'gas', label: 'Gas', icon: Flame },
  { value: 'internet', label: 'Internet', icon: Wifi },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'rent', label: 'Rent', icon: Home },
  { value: 'emi', label: 'EMI/Loan', icon: CreditCard },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'subscription', label: 'Subscription', icon: RefreshCw },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function BillSheet({ open, onClose, editBill }: BillSheetProps) {
  const { addBill, updateBill } = useApp();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<BillType>('other');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState('1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editBill) {
      setName(editBill.name);
      setType(editBill.type);
      setAmount(editBill.amount.toString());
      setDueDate(editBill.dueDate.split('T')[0]);
      setIsRecurring(editBill.isRecurring);
      setRecurringDay(editBill.recurringDay?.toString() || '1');
      setNotes(editBill.notes || '');
    } else {
      resetForm();
    }
  }, [editBill, open]);

  const resetForm = () => {
    setName('');
    setType('other');
    setAmount('');
    setDueDate('');
    setIsRecurring(false);
    setRecurringDay('1');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!name.trim() || !amount || !dueDate) return;

    const billData = {
      name: name.trim(),
      type,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending' as const,
      isPaid: false,
      isRecurring,
      recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
      attachedFileIds: editBill?.attachedFileIds || [],
      notes: notes.trim() || undefined,
    };

    if (editBill) {
      updateBill(editBill.id, billData);
    } else {
      addBill(billData);
    }
    
    onClose();
    resetForm();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{editBill ? 'Edit Bill' : 'Add New Bill'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pb-20">
          <div className="space-y-2">
            <Label htmlFor="name">Bill Name</Label>
            <Input
              id="name"
              placeholder="e.g., Electricity Bill"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Bill Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BillType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {billTypes.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div>
              <p className="font-medium">Recurring Bill</p>
              <p className="text-sm text-muted-foreground">Repeat monthly</p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurringDay">Day of Month</Label>
              <Select value={recurringDay} onValueChange={setRecurringDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!name.trim() || !amount || !dueDate}>
              {editBill ? 'Update Bill' : 'Add Bill'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
