import React, { useState, useEffect } from 'react';
import { Search, Receipt as ReceiptIcon, User, RefreshCw, Printer, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Patient } from '../../types';
import { dataStore } from '../../services/dataService';
import { cn } from '../../lib/utils';

export default function Returns() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataStore.getAll<Receipt>('receipts');
        // Only show paid receipts that can be returned
        setReceipts(data.filter(r => r.status === 'paid'));
      } catch (error) {
        console.error("Failed to load receipts for returns", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleReturnAction = async () => {
    if (!selectedReceipt || !returnReason.trim()) return;

    try {
      // Update receipt status to 'returned'
      await dataStore.updateItem('receipts', selectedReceipt.id, { 
        status: 'returned',
        notes: `سبب المرتجع: ${returnReason}`,
        returnedAt: new Date().toISOString()
      });

      // Update local state
      setReceipts(prev => prev.filter(r => r.id !== selectedReceipt.id));
      setShowReturnModal(false);
      setSelectedReceipt(null);
      setReturnReason('');
      
      alert('تم إرجاع السند بنجاح');
    } catch (error) {
      console.error("Return action failed", error);
      alert('فشل في عملية الإرجاع');
    }
  };

  const filteredReceipts = receipts.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مرتجع سندات الاستعلامات</h2>
          <p className="text-sm text-slate-500">إدارة عمليات إرجاع المبالغ وإلغاء السندات المصدرة</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم السند أو اسم المريض..." 
            className="pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl outline-none w-64 focus:ring-4 focus:ring-sky-500/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4 font-bold">رقم السند</th>
              <th className="px-8 py-4 font-bold">المريض</th>
              <th className="px-8 py-4 font-bold">المبلغ</th>
              <th className="px-8 py-4 font-bold">التاريخ</th>
              <th className="px-8 py-4 font-bold text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic">
            {filteredReceipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-400 text-xs font-mono">#{receipt.id}</td>
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{receipt.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">UID: {receipt.patientId}</div>
                </td>
                <td className="px-8 py-5 font-black text-slate-800 font-mono">{receipt.amount.toLocaleString()} <small className="text-[10px] text-slate-400">ر.ي</small></td>
                <td className="px-8 py-5 text-slate-500 text-xs font-mono">{receipt.date}</td>
                <td className="px-8 py-5">
                   <div className="flex gap-2 justify-center">
                     <button 
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowReturnModal(true);
                      }} 
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold text-xs"
                     >
                        <RefreshCw size={14} />
                        <span>طلب مرتجع</span>
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReceipts.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic">لا توجد سندات قابلة للإرجاع حالياً</div>
        )}
      </div>

      <AnimatePresence>
        {showReturnModal && selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowReturnModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-white/10">
              <div className="flex items-center gap-3 mb-6 text-rose-600">
                <AlertCircle size={24} />
                <h3 className="text-xl font-black">تأكيد عملية المرتجع</h3>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl mb-8 space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">رقم السند:</span>
                  <span className="text-slate-800 font-mono">#{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">المريض:</span>
                  <span className="text-slate-800">{selectedReceipt.patientName}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-3 border-t border-slate-200">
                  <span className="text-slate-400">مبلغ الإرجاع:</span>
                  <span className="text-rose-600 font-mono">{selectedReceipt.amount.toLocaleString()} ر.ي</span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic pr-2">سبب الإرجاع</label>
                <textarea 
                  className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
                  placeholder="يرجى كتابة سبب الإرجاع هنا..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleReturnAction}
                  disabled={!returnReason.trim()}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black tracking-widest text-xs transition-all shadow-xl shadow-rose-600/20",
                    returnReason.trim() ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  تأكيد الإرجاع
                </button>
                <button 
                  onClick={() => setShowReturnModal(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all text-xs"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
