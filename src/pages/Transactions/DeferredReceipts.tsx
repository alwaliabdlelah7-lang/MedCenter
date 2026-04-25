import React, { useState, useEffect } from 'react';
import { Search, Receipt, Clock, CheckCircle, CreditCard, Filter, Download, Printer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType } from '../../types';
import { dataStore } from '../../services/dataService';
import { cn } from '../../lib/utils';

export default function DeferredReceipts() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const data = await dataStore.getAll<ReceiptType>('receipts');
      // Filter for credit or pending payments
      setReceipts(data.filter(r => r.paymentMethod === 'credit' || r.status === 'pending'));
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSettle = async (id: string) => {
    if (confirm('هل تم تحصيل المبلغ بالكامل؟')) {
      const updated = { status: 'paid' as const, paymentMethod: 'cash' as const };
      await dataStore.updateItem('receipts', id, updated);
      setReceipts(receipts.filter(r => r.id !== id));
    }
  };

  const filtered = receipts.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">إدارة السندات الآجلة (المديونية)</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">متابعة المبالغ غير المحصلة، فواتير التأمين، والديون الخارجية</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="البحث برقم السند أو اسم المريض..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none w-64 lg:w-80 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatItem label="إجمالي المبالغ المستحقة" value={`${receipts.reduce((acc, r) => acc + r.amount, 0).toLocaleString()} ر.ي`} icon={AlertTriangle} color="amber" />
        <StatItem label="عدد السندات المعلقة" value={receipts.length} icon={Clock} color="rose" />
        <StatItem label="نسبة التحصيل" value="14.2%" icon={CheckCircle} color="sky" />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
              <th className="px-8 py-6 border-b border-white/5">رقم السند</th>
              <th className="px-8 py-6 border-b border-white/5 text-right">المريض</th>
              <th className="px-8 py-6 border-b border-white/5">المبلغ</th>
              <th className="px-8 py-6 border-b border-white/5">تاريخ الاستحقاق</th>
              <th className="px-8 py-6 border-b border-white/5">الحالة</th>
              <th className="px-8 py-6 border-b border-white/5">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-5 font-mono text-xs font-bold text-slate-500">#{r.id}</td>
                <td className="px-8 py-5 font-black text-white">{r.patientName}</td>
                <td className="px-8 py-5 font-black text-rose-400 font-mono italic">{r.amount.toLocaleString()} ر.ي</td>
                <td className="px-8 py-5 text-slate-400 text-xs font-bold">{r.date}</td>
                <td className="px-8 py-5">
                   <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase italic tracking-widest">
                      Unpaid / Deferred
                   </span>
                </td>
                <td className="px-8 py-5">
                   <div className="flex gap-2">
                      <button onClick={() => handleSettle(r.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">تحصيل المبلغ</button>
                      <button className="p-2 glass bg-white/5 text-slate-500 hover:text-white rounded-xl transition-all"><Printer size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <CreditCard size={48} className="mx-auto mb-4 text-slate-800" />
            <p className="text-slate-600 font-black tracking-widest uppercase italic font-mono text-lg opacity-40">Empty Ledger - All Accounts Settled</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20"
  };
  return (
    <div className="glass p-8 rounded-[40px] border border-white/5 relative group hover:bg-white/5 transition-all">
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform mb-4", colors[color])}>
          <Icon size={28} />
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-2xl font-black text-white font-mono italic tracking-tighter">{value}</p>
    </div>
  );
}
