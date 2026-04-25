import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Printer, 
  Download, 
  Stethoscope, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Filter,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Doctor, Service } from '../../types';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

export default function DoctorCommissions() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [r, d, s] = await Promise.all([
        dataStore.getItems<Receipt>('receipts'),
        dataStore.getItems<Doctor>('doctors'),
        dataStore.getItems<Service>('services')
      ]);
      setReceipts(r);
      setDoctors(d);
      setServices(s);
    };
    loadData();
  }, []);

  const calculateCommissions = () => {
    const list: any[] = [];
    
    const filteredDoctors = selectedDoctor === 'all' 
      ? doctors 
      : doctors.filter(d => d.id === selectedDoctor);

    filteredDoctors.forEach(doc => {
      const docReceipts = receipts.filter(r => r.doctorId === doc.id);
      
      // Calculate total work
      const totalVolume = docReceipts.reduce((sum, r) => sum + r.amount, 0);
      
      // Calculate commission (Assuming a 20% default if not specified, 
      // though ideally it should come from the service or doctor profile)
      // For this demo, we'll use a rule-based approach: 30% for consultations, 15% for surgeries
      const totalCommission = docReceipts.reduce((sum, r) => {
        const service = services.find(s => s.id === r.serviceId);
        const rate = service?.name.includes('كشف') || service?.name.includes('استشارة') ? 0.35 : 0.15;
        return sum + (r.amount * rate);
      }, 0);

      if (totalVolume > 0) {
        list.push({
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty,
          count: docReceipts.length,
          volume: totalVolume,
          commission: Math.round(totalCommission),
          efficiency: Math.round((totalCommission / totalVolume) * 100)
        });
      }
    });

    return list.sort((a, b) => b.commission - a.commission);
  };

  const commissions = calculateCommissions().filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalVolume: commissions.reduce((sum, c) => sum + c.volume, 0),
    totalCommission: commissions.reduce((sum, c) => sum + c.commission, 0),
    topDoctor: commissions[0],
    avgCommission: commissions.length > 0 ? Math.round(commissions.reduce((sum, c) => sum + c.commission, 0) / commissions.length) : 0
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">نسب الأطباء وعوائد العيادات</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">تحليل مالي دقيق لمستحقات الكادر الطبي والأرباح التشغيلية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم الطبيب..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-400 outline-none w-64 transition-all font-bold font-mono tracking-tighter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => exportToCSV(commissions, 'doctor_commissions_report')}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('تقرير مستحقات الأطباء', 'commissions-report-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
         <MiniStat icon={Calculator} label="إجمالي الدخل" value={`${stats.totalVolume.toLocaleString()} ر.ي`} color="sky" />
         <MiniStat icon={DollarSign} label="مستحقات الأطباء" value={`${stats.totalCommission.toLocaleString()} ر.ي`} color="emerald" />
         <MiniStat icon={TrendingUp} label="صافي الربح" value={`${(stats.totalVolume - stats.totalCommission).toLocaleString()} ر.ي`} color="indigo" />
         <MiniStat icon={BarChart3} label="الأعلى دخلاً" value={stats.topDoctor?.name || '---'} color="amber" />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
        <div id="commissions-report-print" className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[3px]">
              <tr>
                <th className="px-8 py-6 border-b border-white/5">الطبيب المختص</th>
                <th className="px-8 py-6 border-b border-white/5">عدد الحالات</th>
                <th className="px-8 py-6 border-b border-white/5">حجم العمل</th>
                <th className="px-8 py-6 border-b border-white/5">النسبة (%)</th>
                <th className="px-8 py-6 border-b border-white/5 text-emerald-400">المستحقات</th>
                <th className="px-8 py-6 border-b border-white/5 text-center no-print">أدوات التحليل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 italic">
              {commissions.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 font-black">
                        {item.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-black text-white group-hover:text-sky-400 transition-colors uppercase tracking-tighter">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{item.specialty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-white font-mono">{item.count} حالة</td>
                  <td className="px-8 py-5 text-slate-300 font-mono tracking-tighter">{item.volume.toLocaleString()} <small className="text-[10px]">ر.ي</small></td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.efficiency}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-indigo-400">{item.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-emerald-400 font-black font-mono bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
                      {item.commission.toLocaleString()} <small className="text-[10px] text-slate-500">ر.ي</small>
                    </span>
                  </td>
                  <td className="px-8 py-5 no-print">
                     <div className="flex gap-2 justify-center">
                       <button className="p-2.5 glass bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all shadow-lg">
                          <BarChart3 size={16} />
                       </button>
                       <button className="p-2.5 glass bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg">
                          <Printer size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {commissions.length === 0 && (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
               <Stethoscope size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-[10px]">لا توجد بيانات للأطباء</p>
            </div>
          )}
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
