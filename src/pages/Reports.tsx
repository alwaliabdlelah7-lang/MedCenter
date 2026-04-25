import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity as ActivityIcon, 
  FileText, 
  Download,
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { Receipt, Doctor, Patient } from '../types';
import { motion } from 'motion/react';
import { dataStore } from '../services/dataService';
import { exportToCSV, printReport } from '../lib/exportUtils';
import { cn } from '../lib/utils';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [r, d, p] = await Promise.all([
        dataStore.getItems<Receipt>('receipts'),
        dataStore.getItems<Doctor>('doctors'),
        dataStore.getItems<Patient>('patients')
      ]);
      setReceipts(r);
      setDoctors(d);
      setPatients(p);
      setLoading(false);
    };
    loadData();
  }, []);

  // Calculate stats
  const totalRevenue = receipts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPatients = receipts.length;
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
    { name: 'نقدي', value: cashPayments, color: '#10b981' },
    { name: 'آجل / تأمين', value: creditPayments, color: '#f59e0b' },
  ];

  // Daily Trend (Last 7 days)
  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('ar-YE');
    const dayReceipts = receipts.filter(r => r.date === date);
    return {
      name: date,
      revenue: dayReceipts.reduce((acc, r) => acc + r.amount, 0),
      count: dayReceipts.length
    };
  });

  return (
    <div className="space-y-8 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">التقارير التحليلية والبيانات الضخمة</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">نظرة عميقة على الأداء المالي، إنتاجية الأطباء، ونمو المركز</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">اليوم</button>
            <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">الأسبوع</button>
            <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">الشهر</button>
          </div>

          <button 
            onClick={() => exportToCSV(receipts, 'hospital_financial_report')}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('التقرير المالي العام', 'full-reports-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <MiniStat 
          icon={DollarSign} 
          label="إجمالي الإيرادات" 
          value={`${totalRevenue.toLocaleString()} ر.ي`} 
          color="emerald"
        />
        <MiniStat 
          icon={Users} 
          label="حركة المراجعين" 
          value={`${totalPatients} مراجعة`} 
          color="sky"
        />
        <MiniStat 
          icon={TrendingUp} 
          label="التحصيل النقدي" 
          value={`${cashPayments.toLocaleString()} ر.ي`} 
          color="amber"
        />
        <MiniStat 
          icon={FileText} 
          label="متوسط قيمة السند" 
          value={`${totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(0) : 0} ر.ي`} 
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="full-reports-print">
        {/* Main Revenue Area Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 glass bg-indigo-500/10 flex items-center justify-center text-indigo-400 rounded-xl">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-black text-white italic tracking-tighter">تحليل التدفق النقدي اليومي</h3>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">آخر 7 أيام نشطة</span>
          </div>
          <div className="h-80 w-full font-mono relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="glass p-8 rounded-[40px] border border-white/5 flex flex-col">
          <h3 className="font-black text-white text-lg mb-8 italic flex items-center gap-2">
            <PieChartIcon size={20} className="text-amber-400" />
            هيكل التحصيل المالي
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-[10px] font-black text-slate-500 uppercase">الإجمالي</span>
               <span className="text-xl font-black text-white">{Math.round((cashPayments/totalRevenue)*100)}%</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             {paymentData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10 group">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-white transition-colors">{item.name}</span>
                 </div>
                 <span className="text-xs font-black text-white font-mono">{item.value.toLocaleString()} <small className="text-[9px] text-slate-500 uppercase">ر.ي</small></span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Top Doctors Table/Chart */}
         <div className="lg:col-span-2 glass p-8 rounded-[40px] border border-white/5">
            <h3 className="text-lg font-black text-white mb-8 italic flex items-center gap-2">
               <ActivityIcon size={20} className="text-sky-400" />
               الأطباء الأكثر إنتاجية وحجوزات
            </h3>
            <div className="space-y-4">
               {doctorRevenueData.slice(0, 5).map((doc, idx) => (
                 <div key={idx} className="glass bg-white/5 p-6 rounded-3xl border border-white/5 transition-all hover:translate-x-2">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 font-black">
                             {idx + 1}
                          </div>
                          <div>
                             <h4 className="font-black text-white uppercase tracking-tighter">{doc.name}</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-0.5">Performance Rank: Elite</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-black uppercase">Revenue Generated</p>
                          <p className="text-lg font-black text-sky-400 font-mono">{doc.revenue.toLocaleString()} <small className="text-[10px]">ر.ي</small></p>
                       </div>
                    </div>
                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(doc.revenue/totalRevenue)*100}%` }}
                          className="absolute h-full bg-sky-500 rounded-full" 
                       />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                       <span>Market Share: {Math.round((doc.revenue/totalRevenue)*100)}%</span>
                       <span className="text-emerald-500">Net Profit Contribution High</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Extra Insights */}
         <div className="glass p-8 rounded-[40px] border border-white/5 space-y-8">
            <h3 className="text-lg font-black text-white italic flex items-center gap-2">
               <ActivityIcon size={20} className="text-indigo-400" />
               نظرة تشغيلية عامة
            </h3>
            
            <div className="space-y-6">
               <InsightBadge label="نمو المراجعين" value="+12%" icon={ArrowUpRight} color="emerald" />
               <InsightBadge label="كفاءة المختبر" value="98.2%" icon={ActivityIcon} color="sky" />
               <InsightBadge label="صرف الصيدلية" value="قوي" icon={BarChart3} color="indigo" />
               <InsightBadge label="درجة رضا المرضى" value="4.8/5" icon={TrendingUp} color="amber" />
            </div>

            <div className="mt-12 p-6 glass bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[2px] mb-3">Health Score AI</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed italic">يُظهر المركز الطبي أداءً مالياً مستقراً مع نمو بنسبة 14% في قسم الأشعة. يُنصح بتحسين عمليات تحصيل السندات الآجلة لزيادة التدفق النقدي بنسبة 5% إضافية الشهر القادم.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  return (
    <div className="glass p-8 rounded-[36px] border border-white/5 flex flex-col gap-4 group hover:bg-white/5 transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2 italic">{label}</p>
        <p className="text-2xl font-black text-white tracking-widest">{value}</p>
      </div>
    </div>
  );
}

function InsightBadge({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  return (
    <div className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl border border-white/5">
       <div className="flex items-start gap-4">
          <div className={cn("p-2.5 rounded-xl border", colors[color])}>
             <Icon size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-md font-black text-white mt-1 uppercase italic tracking-tighter">{value}</p>
          </div>
       </div>
    </div>
  );
}
