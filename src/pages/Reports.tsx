import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity as ActivityIcon, Download, Calendar, Receipt as ReceiptIcon, TrendingDown } from 'lucide-react';
import { Receipt, Doctor, Patient } from '../types';
import { dataStore } from '../services/dataService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, d, p] = await Promise.all([
          dataStore.getAll<Receipt>('receipts'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Patient>('patients')
        ]);
        setReceipts(r);
        setDoctors(d);
        setPatients(p);
      } catch (error) {
        console.error("Failed to load reports data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const unsubscribe = dataStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Calculate stats
  const totalRevenue = receipts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPatients = patients.length;
  const cashPayments = receipts.filter(r => r.paymentMethod === 'cash').reduce((acc, curr) => acc + curr.amount, 0);
  const creditPayments = totalRevenue - cashPayments;

  // Revenue by Doctor
  const doctorRevenueData = doctors.map(doc => {
    const revenue = receipts.filter(r => r.doctorId === doc.id).reduce((acc, curr) => acc + curr.amount, 0);
    const doctorShare = (revenue * (doc.percentage / 100));
    return {
      name: doc.name,
      revenue,
      doctorShare
    };
  }).filter(d => d.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Payment Method Data
  const paymentData = [
    { name: 'نقدي', value: cashPayments, color: '#0ea5e9' },
    { name: 'آجل / تأمين', value: creditPayments, color: '#8b5cf6' },
  ];

  // Daily revenue for the last 15 days
  const dailyRevenueData = Array.from({ length: 15 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('ar-YE');
    const dayRevenue = receipts
      .filter(r => r.date === dateStr && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    return { 
      date: dateStr, 
      revenue: dayRevenue,
      shortDate: date.toLocaleDateString('ar-YE', { day: 'numeric', month: 'numeric' }) 
    };
  }).reverse();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">التحليلات والتقارير المالية</h2>
          <p className="text-sm text-slate-500 border-r-4 border-sky-500 pr-3 mt-1 font-bold">نظرة استراتيجية شاملة على أداء المنشأة الطبي والمالي</p>
        </div>
        <button className="flex items-center gap-3 px-6 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white hover:bg-white/10 transition-all shadow-xl group">
          <Download size={18} className="group-hover:translate-y-1 transition-transform" />
          <span>تصدير ملف التحليل المالي (PDF)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign} 
          label="إجمالي الإيرادات" 
          value={totalRevenue} 
          unit="ر.ي" 
          color="emerald" 
          trend="+12%"
        />
        <StatCard 
          icon={Users} 
          label="إجمالي المسجلين" 
          value={totalPatients} 
          unit="مريض" 
          color="sky" 
          trend="+5%"
        />
        <StatCard 
          icon={TrendingUp} 
          label="التحصيل النقدي" 
          value={cashPayments} 
          unit="ر.ي" 
          color="amber" 
          trend="+8%"
        />
        <StatCard 
          icon={ReceiptIcon} 
          label="متوسط قيمة السند" 
          value={totalPatients > 0 ? (totalRevenue / totalPatients) : 0} 
          unit="ر.ي" 
          color="indigo" 
          trend="+3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-[40px] border border-white/5 shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 glass bg-sky-500/10 flex items-center justify-center text-sky-400 rounded-2xl shadow-lg">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white">تحليل المبيعات اليومي</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Sales Performance - Last 15 Days</p>
                 </div>
              </div>
           </div>
           <div className="h-80 w-full font-mono">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dailyRevenueData}>
                    <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                    <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Payment Methods */}
        <div className="glass p-8 rounded-[40px] border border-white/5 shadow-2xl">
           <h3 className="text-white font-black text-lg mb-8 text-center border-b border-white/5 pb-4 uppercase tracking-tighter">توزيع طرق الدفع</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={paymentData}
                       cx="50%" cy="50%"
                       innerRadius={65}
                       outerRadius={85}
                       paddingAngle={10}
                       dataKey="value"
                    >
                       {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-3">
              {paymentData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10 group">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }} />
                     <span className="text-xs font-black text-slate-400 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-white font-mono">{item.value.toLocaleString()} <small className="text-[10px] text-slate-600 font-normal">ر.ي</small></span>
                </div>
              ))}
           </div>
        </div>

        {/* Doctor Performance */}
        <div className="lg:col-span-3 glass p-10 rounded-[50px] border border-white/5 shadow-2xl">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 glass bg-indigo-500/10 flex items-center justify-center text-indigo-400 rounded-3xl shadow-xl">
                 <ActivityIcon size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-white tracking-tight">أداء الأطباء والمساهمات المالية</h3>
                 <p className="text-xs text-slate-500 opacity-70 uppercase tracking-[4px] font-black italic">Physician Revenue & Commission Ledger</p>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="text-[10px] text-slate-500 font-black uppercase tracking-[3px] border-b border-white/5">
                       <th className="pb-6 text-right">اسم الطبيب المختص</th>
                       <th className="pb-6 text-center">إجمالي الإيرادات المحققة</th>
                       <th className="pb-6 text-center">نسبة الطبيب (%)</th>
                       <th className="pb-6 text-left pl-6">صافي استحقاق الطبيب</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {doctorRevenueData.map((doc, idx) => {
                      const doctorObj = doctors.find(d => d.name === doc.name);
                      return (
                        <tr key={idx} className="group hover:bg-white/5 transition-colors">
                           <td className="py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs shadow-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    {doc.name.charAt(2)}
                                 </div>
                                 <span className="font-bold text-white text-sm">{doc.name}</span>
                              </div>
                           </td>
                           <td className="py-6 text-center">
                              <span className="font-black text-sky-400 font-mono tracking-tight">{doc.revenue.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-600 mr-1 italic">ر.ي</span>
                           </td>
                           <td className="py-6 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                 <span className="text-xs font-black text-emerald-400">{doctorObj?.percentage || 0}%</span>
                              </div>
                           </td>
                           <td className="py-6 text-left pl-6">
                              <div className="text-lg font-black text-white font-mono tracking-tighter">
                                 {doc.doctorShare.toLocaleString()}
                                 <small className="text-[10px] text-slate-500 mr-2 not-italic font-black">ر.ي</small>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                    {doctorRevenueData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center opacity-20 italic text-slate-500 font-black uppercase tracking-[15px]">No Data Records Found</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color, trend }: { icon: any, label: string, value: number, unit: string, color: string, trend: string }) {
  const colors = {
    sky: "bg-sky-500 text-sky-400 border-sky-500/20",
    emerald: "bg-emerald-500 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500 text-amber-400 border-amber-500/20",
    indigo: "bg-indigo-500 text-indigo-400 border-indigo-500/20",
    rose: "bg-rose-500 text-rose-400 border-rose-500/20",
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group shadow-2xl"
    >
       <div className={cn("absolute -top-12 -right-12 w-48 h-48 blur-[80px] rounded-full opacity-10 transition-opacity group-hover:opacity-20", colors[color as keyof typeof colors].split(' ')[0])} />
       
       <div className="flex items-center justify-between mb-8 relative z-10">
          <div className={cn("p-4 rounded-2xl glass shadow-xl", colors[color as keyof typeof colors].split(' ')[1])}>
             <Icon size={28} />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp size={12} /> {trend}
             </span>
             <span className="text-[9px] text-slate-600 font-black mt-1 uppercase italic tracking-widest">Growth Factor</span>
          </div>
       </div>

       <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-2 italic">{label}</p>
          <h3 className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-2">
             {value.toLocaleString()}
             <small className="text-xs font-bold text-slate-500 not-italic uppercase opacity-50">{unit}</small>
          </h3>
       </div>
    </motion.div>
  );
}

