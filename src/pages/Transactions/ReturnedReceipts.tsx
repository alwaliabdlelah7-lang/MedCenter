import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Receipt, 
  Trash2, 
  Calendar,
  Download,
  Printer,
  History,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  User,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType } from '../../types';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

interface ReturnedReceipt extends ReceiptType {
  returnDate: string;
  returnReason: string;
  returnedBy: string;
}

export default function ReturnedReceipts() {
  const [returnedReceipts, setReturnedReceipts] = useState<ReturnedReceipt[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReturnModal, setShowReturnModal] = useState<ReceiptType | null>(null);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const rs = await dataStore.getItems<ReceiptType>('receipts');
      setReceipts(rs);
      
      // Mock some previously returned ones
      const mockReturns: ReturnedReceipt[] = [
        { ...rs[0], id: 'RET-001', returnDate: '2026-04-24', returnReason: 'خطأ في نوع الخدمة', returnedBy: 'أحمد الإداري' },
      ];
      if (rs.length > 0) setReturnedReceipts(mockReturns);
    };
    loadData();
  }, []);

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;

    const newReturn: ReturnedReceipt = {
      ...showReturnModal,
      id: `RET-${Math.floor(100 + Math.random() * 900)}`,
      returnDate: new Date().toLocaleDateString('ar-YE'),
      returnReason: returnReason,
      returnedBy: 'المستخدم الحالي'
    };

    setReturnedReceipts([newReturn, ...returnedReceipts]);
    setReceipts(receipts.filter(r => r.id !== showReturnModal.id));
    setShowReturnModal(null);
    setReturnReason('');
    alert('تم تنفيذ عملية المرتجع بنجاح');
  };

  const filtered = returnedReceipts.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">أرشيف مرتجعات السندات</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">إدارة وإلغاء السندات المالية المستردة وضبط السجلات المحاسبية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث في الأرشيف..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-400 outline-none w-64 transition-all font-bold font-mono tracking-tighter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => exportToCSV(returnedReceipts, 'returned_receipts')}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('أرشيف المرتجعات المالية', 'returns-list-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => setShowReturnModal(receipts[0])} // For demo purpose picking first active receipt
            className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black shadow-xl shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
          >
            <RotateCcw size={18} />
            <span>إجراء مرتجع جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
         <MiniStat icon={History} label="إجمالي المستردات" value={returnedReceipts.length} color="rose" />
         <MiniStat icon={Activity} label="القيمة المستردة" value={`${returnedReceipts.reduce((acc, r) => acc + r.amount, 0).toLocaleString()} ر.ي`} color="amber" />
         <MiniStat icon={AlertTriangle} label="عمليات اليوم" value={returnedReceipts.filter(r => r.returnDate === new Date().toLocaleDateString('ar-YE')).length} color="sky" />
         <MiniStat icon={User} label="الموظف المسؤول" value="أدمن النظام" color="indigo" />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
        <div id="returns-list-print" className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[3px]">
              <tr>
                <th className="px-8 py-6 border-b border-white/5">رقم المرتجع</th>
                <th className="px-8 py-6 border-b border-white/5">المراجع</th>
                <th className="px-8 py-6 border-b border-white/5">المبلغ المسترد</th>
                <th className="px-8 py-6 border-b border-white/5">تاريخ الإلغاء</th>
                <th className="px-8 py-6 border-b border-white/5">سبب المرتجع</th>
                <th className="px-8 py-6 border-b border-white/5 text-center no-print">أدوات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 italic">
              {filtered.map((ret) => (
                <tr key={ret.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-black text-slate-400 text-xs font-mono tracking-tighter">#{ret.id}</td>
                  <td className="px-8 py-5">
                    <div className="font-black text-white group-hover:text-rose-400 transition-colors uppercase tracking-tighter">{ret.patientName}</div>
                    <div className="text-[10px] text-slate-500 font-mono italic">UID: {ret.patientId}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-rose-400 font-black font-mono bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10">
                      {ret.amount.toLocaleString()} <small className="text-[10px] text-slate-500">ر.ي</small>
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-300 text-xs font-mono">{ret.returnDate}</td>
                  <td className="px-8 py-5">
                    <div className="text-[11px] font-bold text-slate-400 max-w-xs truncate">{ret.returnReason}</div>
                    <div className="text-[9px] text-sky-500/50 mt-1 uppercase italic">بواسطة: {ret.returnedBy}</div>
                  </td>
                  <td className="px-8 py-5 no-print">
                     <div className="flex gap-2 justify-center">
                       <button className="p-2.5 glass bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all shadow-lg">
                          <Printer size={16} />
                       </button>
                       <button className="p-2.5 glass bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all shadow-lg">
                          <Download size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
               <RotateCcw size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-[10px]">لا توجد عمليات مرتجع</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowReturnModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-lg glass bg-red-950/20 rounded-[40px] p-12 border border-red-500/20 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setShowReturnModal(null)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white"><X size={20} /></button>
                <h3 className="text-3xl font-black text-rose-400 italic tracking-tighter uppercase">إلغاء سند مالي</h3>
              </div>
              
              <div className="space-y-8">
                <div className="glass bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase">سند رقم:</span>
                      <span className="text-white font-mono font-black">#{showReturnModal.id}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase">المراجع:</span>
                      <span className="text-white font-black">{showReturnModal.patientName}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase font-mono tracking-widest">المبلغ المطلوب ردّه:</span>
                      <span className="text-rose-400 font-black text-xl">{showReturnModal.amount.toLocaleString()} ر.ي</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">سبب طلب المرتجع (إلزامي)</label>
                   <textarea 
                    className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-3xl text-white outline-none focus:border-rose-500 font-bold transition-all h-32 resize-none"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="اكتب سبب إلغاء السند هنا..."
                   />
                </div>

                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                   <AlertTriangle className="text-rose-400 shrink-0" size={20} />
                   <p className="text-[9px] text-rose-300 font-black leading-relaxed">تحذير: سيتم إلغاء السند نهائياً من السجلات المالية النشطة ونقله إلى أرشيف المرتجعات. لا يمكن التراجع عن هذه الخطوة.</p>
                </div>

                <button 
                  onClick={handleReturn}
                  disabled={!returnReason}
                  className="w-full bg-rose-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-rose-600/30 hover:bg-rose-500 transition-all uppercase tracking-widest text-xs disabled:opacity-30"
                >
                  تأكيد الإلغاء ورد المبلغ
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
