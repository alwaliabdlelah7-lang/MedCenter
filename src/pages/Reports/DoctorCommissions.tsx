import React, { useState, useEffect } from 'react';
import { User, DollarSign, Calculator, Download, Printer, Filter, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Receipt, Doctor } from '../../types';
import { dataStore } from '../../services/dataService';
import { exportToCSV } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

export default function DoctorCommissions() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const loadData = async () => {
      const [r, d] = await Promise.all([
        dataStore.getAll<Receipt>('receipts'),
        dataStore.getAll<Doctor>('doctors')
      ]);
      setReceipts(r);
      setDoctors(d);
      setLoading(false);
    };
    loadData();
  }, []);

  const commissionData = doctors.map(doc => {
    const doctorReceipts = receipts.filter(r => r.doctorId === doc.id);
    const totalRevenue = doctorReceipts.reduce((acc, curr) => acc + curr.amount, 0);
    const commissionAmount = (totalRevenue * (doc.percentage / 100));
    return {
      ...doc,
      totalRevenue,
      commissionAmount,
      patientCount: doctorReceipts.length
    };
  }).filter(d => d.totalRevenue > 0);

  const handleExport = () => {
    const data = commissionData.map(d => ({
      'اسم الطبيب': d.name,
      'التخصص': d.specialization,
      'النسبة (%)': d.percentage,
      'عدد الحالات': d.patientCount,
      'إجمالي الإيرادات': d.totalRevenue,
      'مستحقات الطبيب': d.commissionAmount
    }));
    exportToCSV(data, 'doctor_commissions');
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">تقرير عمولات ومستحقات الأطباء</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">حساب العمولات بناءً على النسب المئوية المتفق عليها لكل طبيب</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleExport} className="p-3 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all">
            <Download size={20} />
          </button>
          <button className="p-3 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition-all">
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {commissionData.map((doc) => (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             key={doc.id} 
             className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group"
           >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -translate-x-8 -translate-y-8" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <User size={28} />
                 </div>
                 <div>
                    <h3 className="font-black text-white">{doc.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-1">{doc.specialization}</p>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">نسبة الطبيب:</span>
                    <span className="text-indigo-400 font-black font-mono italic">{doc.percentage}%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">إجمالي الإيراد:</span>
                    <span className="text-white font-black font-mono">{doc.totalRevenue.toLocaleString()} <small className="text-[10px] opacity-50">ر.ي</small></span>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-emerald-400 font-black text-xs flex items-center gap-2">
                       <DollarSign size={14} /> صافي المستحقات
                    </span>
                    <span className="text-2xl font-black text-white font-mono tracking-tighter">
                       {doc.commissionAmount.toLocaleString()}
                    </span>
                 </div>
              </div>

              <div className="mt-6 flex gap-2">
                 <button className="flex-1 py-3 bg-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                    عرض الكشف التفصيلي
                 </button>
              </div>
           </motion.div>
         ))}
      </div>

      {commissionData.length === 0 && (
        <div className="py-20 text-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
           <Calculator size={48} className="mx-auto mb-4 text-slate-600" />
           <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">لا توجد بيانات عمولات للفترة الحالية</p>
        </div>
      )}
    </div>
  );
}
