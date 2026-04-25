import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Receipt, 
  User, 
  DollarSign, 
  Printer, 
  Trash2, 
  Calendar,
  Download,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType, Patient } from '../../types';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

interface DeferredBill {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'overdue';
}

export default function DeferredPayments() {
  const [bills, setBills] = useState<DeferredBill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState<DeferredBill | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const [ps, rs] = await Promise.all([
        dataStore.getItems<Patient>('patients'),
        dataStore.getItems<ReceiptType>('receipts')
      ]);
      setPatients(ps);
      
      // Mock some deferred data based on receipts that might have balance, 
      // or just generate some for the "Real" experience
      const mockDeferred: DeferredBill[] = [
        { id: 'DEF-1001', patientId: ps[0]?.id || '1', patientName: ps[0]?.name || 'محمد عبدالله', totalAmount: 15000, paidAmount: 5000, remainingAmount: 10000, dueDate: '2026-05-01', status: 'partially_paid' },
        { id: 'DEF-1002', patientId: ps[1]?.id || '2', patientName: ps[1]?.name || 'فاطمة علي', totalAmount: 25000, paidAmount: 0, remainingAmount: 25000, dueDate: '2026-04-20', status: 'overdue' },
        { id: 'DEF-1003', patientId: ps[2]?.id || '3', patientName: ps[2]?.name || 'أحمد حسن', totalAmount: 8500, paidAmount: 8500, remainingAmount: 0, dueDate: '2026-04-25', status: 'pending' },
      ];
      setBills(mockDeferred.filter(b => b.remainingAmount > 0));
    };
    loadData();
  }, []);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    const amount = parseInt(payAmount);
    setBills(bills.map(b => {
      if (b.id === showPayModal.id) {
        const newPaid = b.paidAmount + amount;
        const newRemaining = b.totalAmount - newPaid;
        return {
          ...b,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining <= 0 ? 'pending' : 'partially_paid'
        };
      }
      return b;
    }).filter(b => b.remainingAmount > 0));

    setShowPayModal(null);
    setPayAmount('');
    alert('تم تسجيل الدفعة بنجاح وإصدار مستند سداد');
  };

  const handleExportCSV = () => {
    const data = filtered.map(b => ({
      'المعرف': b.id,
      'المريض': b.patientName,
      'الإجمالي': b.totalAmount,
      'المدفوع': b.paidAmount,
      'المتبقي': b.remainingAmount,
      'تاريخ الاستحقاق': b.dueDate,
      'الحالة': b.status
    }));
    exportToCSV(data, 'deferred_payments');
  };

  const stats = {
    totalRemaining: bills.reduce((acc, b) => acc + b.remainingAmount, 0),
    overdueCount: bills.filter(b => b.status === 'overdue').length,
    activePatients: new Set(bills.map(b => b.patientId)).size,
    avgDebt: bills.length > 0 ? Math.round(bills.reduce((acc, b) => acc + b.remainingAmount, 0) / bills.length) : 0
  };

  const filtered = bills.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">تحصيل السندات الآجلة والمديونيات</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">متابعة الدفعات الجزئية وتحصيل الأرصدة المتبقية من الحسابات</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث برقم السند أو المريض..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-400 outline-none w-64 transition-all font-bold font-mono tracking-tighter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('تقرير السندات الآجلة', 'deferred-list-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
         <MiniStat icon={DollarSign} label="إجمالي المديونية" value={`${stats.totalRemaining.toLocaleString()} ر.ي`} color="sky" />
         <MiniStat icon={AlertCircle} label="سنوات متأخرة" value={stats.overdueCount} color="rose" />
         <MiniStat icon={User} label="مدينين نشطين" value={stats.activePatients} color="amber" />
         <MiniStat icon={TrendingDown} label="متوسط الدين" value={`${stats.avgDebt.toLocaleString()} ر.ي`} color="indigo" />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
        <div id="deferred-list-print" className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[3px]">
              <tr>
                <th className="px-8 py-6 border-b border-white/5">رقم المديونية</th>
                <th className="px-8 py-6 border-b border-white/5">المراجع المدين</th>
                <th className="px-8 py-6 border-b border-white/5">المبلغ الإجمالي</th>
                <th className="px-8 py-6 border-b border-white/5">المسدد / المتبقي</th>
                <th className="px-8 py-6 border-b border-white/5">موعد الاستحقاق</th>
                <th className="px-8 py-6 border-b border-white/5 text-center no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 italic">
              {filtered.map((bill) => (
                <tr key={bill.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-black text-slate-400 text-xs font-mono tracking-tighter">#{bill.id}</td>
                  <td className="px-8 py-5">
                    <div className="font-black text-white group-hover:text-sky-400 transition-colors">{bill.patientName}</div>
                    <div className="text-[10px] text-slate-500 font-mono italic">ID: {bill.patientId}</div>
                  </td>
                  <td className="px-8 py-5 text-white font-mono">{bill.totalAmount.toLocaleString()} ر.ي</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="text-emerald-400 font-bold text-[10px]">{bill.paidAmount.toLocaleString()} مسدد</div>
                      <div className="text-rose-400 font-black text-sm">{bill.remainingAmount.toLocaleString()} متبقي</div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs font-mono">
                    <div className={cn(
                      "flex items-center gap-2",
                      bill.status === 'overdue' ? 'text-rose-400 animate-pulse' : ''
                    )}>
                      {bill.dueDate}
                      {bill.status === 'overdue' && <AlertCircle size={14} />}
                    </div>
                  </td>
                  <td className="px-8 py-5 no-print">
                     <div className="flex gap-2 justify-center">
                       <button 
                        onClick={() => setShowPayModal(bill)} 
                        className="flex items-center gap-2 px-4 py-2 glass bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                       >
                          <DollarSign size={14} /> سداد
                       </button>
                       <button className="p-2.5 glass bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all">
                          <Printer size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
               <CheckCircle2 size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-[10px]">لا توجد مديونيات معلقة</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowPayModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md glass bg-slate-900/95 rounded-[40px] p-10 border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setShowPayModal(null)} className="p-2 glass rounded-xl text-slate-500 hover:text-white"><X size={20} /></button>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">تحصيل دفعة مالية</h3>
              </div>
              
              <div className="space-y-6">
                <div className="glass bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                   <div className="flex justify-between text-[10px] uppercase font-black text-slate-500">
                      <span>المراجع:</span>
                      <span className="text-white">{showPayModal.patientName}</span>
                   </div>
                   <div className="flex justify-between text-[10px] uppercase font-black text-slate-500">
                      <span>إجمالي المديونية:</span>
                      <span className="text-rose-400">{showPayModal.remainingAmount.toLocaleString()} ر.ي</span>
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">مبلغ السداد الحالي</label>
                  <input 
                    type="number"
                    className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold font-mono transition-all text-2xl text-center"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                  <p className="text-[9px] text-slate-500 text-center font-bold">سيتم إصدار سند قبض آلي فور التأكيد</p>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={!payAmount || parseInt(payAmount) <= 0}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  تأكيد التحصيل الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  return (
    <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-black text-white mt-0.5 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
