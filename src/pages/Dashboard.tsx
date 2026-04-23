import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity as ActivityIcon, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Bell,
  Clock,
  FlaskConical,
  AlertTriangle,
  History as HistoryIcon,
  CheckCircle2,
  ChevronRight,
  Database,
  Smartphone,
  Monitor,
  CreditCard
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Appointment, Patient, User, Doctor, PharmacyItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../services/dataService';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS } from '../data/seedData';

const chartData = [
  { name: 'السبت', revenue: 45000, appointments: 12 },
  { name: 'الأحد', revenue: 32000, appointments: 8 },
  { name: 'الاثنين', revenue: 98000, appointments: 25 },
  { name: 'الثلاثاء', revenue: 41000, appointments: 15 },
  { name: 'الأربعاء', revenue: 65000, appointments: 18 },
  { name: 'الخميس', revenue: 39000, appointments: 10 },
  { name: 'الجمعة', revenue: 25000, appointments: 5 },
];

const patientTypeData = [
  { name: 'مرضى جدد', value: 40, color: '#0ea5e9' },
  { name: 'متابعة', value: 35, color: '#8b5cf6' },
  { name: 'عودة مجانية', value: 25, color: '#f59e0b' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeUsersCount] = useState(14);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [apptsData, patientsData, doctorsData, medsData] = await Promise.all([
          dataStore.getAll<Appointment>('appointments'),
          dataStore.getAll<Patient>('patients'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<PharmacyItem>('pharmacy_items')
        ]);
        setAppointments(apptsData.length > 0 ? apptsData : INITIAL_APPOINTMENTS);
        setPatients(patientsData.length > 0 ? patientsData : INITIAL_PATIENTS);
        setDoctors(doctorsData);
        setMedicines(medsData);
      } catch (error) {
        console.error("Dashboard data load failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { label: 'حجز موعد', icon: Calendar, color: 'bg-sky-500', path: '/appointments' },
    { label: 'سجل مريض', icon: Users, color: 'bg-indigo-500', path: '/patients' },
    { label: 'صرف دواء', icon: ActivityIcon, color: 'bg-emerald-500', path: '/pharmacy' },
    { label: 'طلب فحص', icon: FlaskConical, color: 'bg-amber-500', path: '/laboratory' },
  ];

  const todayAppts = appointments.filter(a => a.date === currentTime.toISOString().split('T')[0]);
  const expectedRevenue = todayAppts.reduce((sum, a) => sum + (a.cost || 0), 0);

  const stats = [
    { 
      label: 'إجمالي المرضى', 
      value: patients.length.toLocaleString(), 
      trend: `+${patients.filter(p => new Date(p.createdAt) > new Date(Date.now() - 86400000 * 7)).length}`, 
      trendUp: true, 
      icon: Users, 
      color: 'sky' 
    },
    { 
      label: 'دخل اليوم المتوقع', 
      value: `${expectedRevenue.toLocaleString()} ر.ي`, 
      trend: todayAppts.length.toString(), 
      trendUp: true, 
      icon: TrendingUp, 
      color: 'emerald' 
    },
    { 
      label: 'مستخدمون نشطون عبر الأجهزة', 
      value: activeUsersCount.toString(), 
      trend: 'متصل', 
      trendUp: true, 
      icon: UserCheck, 
      color: 'indigo' 
    },
    { 
      label: 'مواعيد في الانتظار', 
      value: appointments.filter(a => a.status === 'waiting').length.toString(), 
      trend: appointments.filter(a => a.status === 'scheduled').length > 5 ? 'عالي' : 'طبيعي', 
      trendUp: appointments.filter(a => a.status === 'scheduled').length <= 5, 
      icon: Clock, 
      color: 'amber' 
    },
  ];

  const [platformStatus] = useState([
    { platform: 'Web / PWA', status: 'Online', icon: Monitor },
    { platform: 'Android App', status: 'Ready', icon: Smartphone },
    { platform: 'Windows Desktop', status: 'Ready', icon: CreditCard }, // CreditCard as placeholder for desktop if needed, or Monitor
  ]);

  const [buildInfo] = useState({
    version: '1.0.0-PRO',
    lastSync: 'Now',
    env: 'Production'
  });

  const lowStockMeds = medicines.filter(m => m.stock < 20);

  return (
    <div className="space-y-8 lg:p-4 text-right">
      {/* Quick Actions & Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 text-sky-400">
            <Clock size={16} className="animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-[3px] uppercase">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 mx-1" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {currentTime.toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">لوحة القيادة المركزية</h2>
          <p className="text-sm text-indigo-300/70 border-r-4 border-indigo-500 pr-3 font-medium">مرحباً بك مجدداً، نظرة عامة شاملة على نشاط المنشأة اليوم</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 glass bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all shadow-lg group"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg", action.color)}>
                <action.icon size={18} />
              </div>
              <span className="text-xs font-bold whitespace-nowrap">{action.label}</span>
            </motion.button>
          ))}
          
          <div className="h-10 w-px bg-white/10 mx-2 hidden lg:block" />
          
          <div className="px-5 py-2.5 glass bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             حالة السيرفر: متصل عبر Cloud
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-center bg-indigo-500/5 p-4 rounded-[32px] border border-indigo-500/10">
         <div className="flex items-center gap-4 px-6 py-2">
            <div className="relative w-16 h-16">
               <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - 0.94)} className="text-sky-500" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xs">94%</div>
            </div>
            <div>
               <p className="text-[10px] text-slate-500 font-black uppercase italic">معدل استجابة النظام</p>
               <p className="text-sm font-bold text-sky-400">مثالي (Excellent)</p>
            </div>
         </div>
         <div className="h-10 w-px bg-white/5 hidden xl:block" />
         <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
            <PerformanceStat label="سرعة الفهرسة" value="0.2ms" color="sky" />
            <PerformanceStat label="وقت المعالجة" value="1.4s" color="indigo" />
            <PerformanceStat label="ضغط الملفات" value="GZIP x4" color="emerald" />
            <PerformanceStat label="الأمان (Firewall)" value="نشط 100%" color="rose" />
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-6 rounded-3xl relative overflow-hidden group border border-white/5"
          >
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full translate-x-12 -translate-y-12 transition-colors duration-500",
              `bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20`
            )} />
            
            <div className="flex items-start justify-between relative z-10">
              <div className={cn(
                "p-3 rounded-2xl",
                `bg-${stat.color}-500/10 text-${stat.color}-400`
              )}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
                stat.trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              )}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest italic">{stat.label}</p>
              <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-3xl border border-white/5">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 glass bg-indigo-500/10 flex items-center justify-center text-indigo-400 rounded-xl">
                      <TrendingUp size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-white">تحليل الإيرادات الأسبوعي</h3>
                </div>
                <div className="flex gap-2">
                   {['الأسبوعي', 'الشهري'].map((t) => (
                     <button key={t} className={cn(
                       "text-[10px] font-black px-4 py-2 rounded-xl border transition-all",
                       t === 'الأسبوعي' ? "bg-indigo-600 border-indigo-600 text-white" : "glass border-white/10 text-slate-500"
                     )}>{t}</button>
                   ))}
                </div>
             </div>
             <div className="h-80 w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        itemStyle={{ color: '#8b5cf6' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass p-8 rounded-3xl border border-white/5">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                   <ActivityIcon size={18} className="text-sky-400" />
                   توزيع فئات المرضى
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={patientTypeData}
                            cx="50%" cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {patientTypeData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                   {patientTypeData.map((t) => (
                     <div key={t.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-[10px] text-slate-400 font-bold">{t.name}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-rose-400" />
                   تنبيهات النظام الذكية
                </h3>
                <div className="space-y-3">
                   {lowStockMeds.slice(0, 3).map((med, i) => (
                     <DashboardAlert 
                       key={i}
                       type="danger" 
                       title="مخزون حرج" 
                       desc={`الدواء '${med.tradeName || med.name}' متبقي ${med.stock} قطعة فقط.`} 
                     />
                   ))}
                   {appointments.filter(a => a.status === 'scheduled').length > 10 && (
                     <DashboardAlert 
                       type="warning" 
                       title="ازدحام في المواعيد" 
                       desc="يوجد عدد كبير من المواعيد المجدولة لليوم." 
                     />
                   )}
                   {appointments.filter(a => a.returnDate === currentTime.toISOString().split('T')[0]).map((app, i) => (
                     <DashboardAlert 
                       key={`ret-${i}`}
                       type="info" 
                       title="موعد عودة قادم" 
                       desc={`المريض '${app.patientName}' لديه موعد عودة مجانية اليوم.`} 
                     />
                   ))}
                   {lowStockMeds.length === 0 && appointments.length > 0 && (
                     <div className="text-center py-10 opacity-20 italic text-xs font-bold uppercase tracking-widest text-slate-500">لا توجد تنبيهات عاجلة</div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
           <div className="glass p-6 rounded-3xl border border-white/5 overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold text-sm">حركة السيرفر اللحظية</h3>
                 <ActivityIcon size={14} className="text-sky-400 animate-pulse" />
              </div>
              <div className="flex items-end gap-1 h-12 mb-4">
                 {[40, 70, 45, 90, 65, 30, 85, 40, 55, 75, 40, 60].map((h, i) => (
                    <motion.div 
                       key={i} 
                       initial={{ height: 0 }}
                       animate={{ 
                         height: [`${h}%`, `${Math.min(100, Math.max(10, h + (Math.random() * 40 - 20)))}%`, `${h}%`]
                       }}
                       transition={{ 
                         repeat: Infinity, 
                         duration: 2 + Math.random() * 2,
                         ease: "easeInOut"
                       }}
                    className={cn(
                      "flex-1 rounded-t-sm transition-colors duration-500",
                      h > 80 ? "bg-rose-500/50" : "bg-sky-500/30"
                    )} />
                 ))}
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase text-center tracking-[2px]">Data Sync Active</p>
           </div>

           <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass bg-sky-500/10 flex items-center justify-center text-sky-400 rounded-xl">
                       <Database size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white">حالة المنصات والمزامنة</h3>
                 </div>
                 <span className="text-[10px] font-black px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-widest italic">Live CI/CD</span>
              </div>

              <div className="space-y-3 mt-6">
                 {platformStatus.map((ps, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <ps.icon size={16} className="text-slate-400" />
                         <span className="text-xs font-bold text-slate-200 tracking-tight">{ps.platform}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                         {ps.status}
                      </span>
                   </div>
                 ))}
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[9px] text-slate-500 font-black uppercase italic">Build Version</p>
                       <p className="text-xs font-mono text-indigo-400">{buildInfo.version}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] text-slate-500 font-black uppercase italic">GitHub Sync</p>
                       <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {buildInfo.lastSync}
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold text-sm">أطباء متاحون حالياً</h3>
                 <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">اونلاين</span>
              </div>
              <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex items-center gap-3 p-3 glass-card rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                      <div className="relative">
                         <img src={`https://picsum.photos/seed/doc${i}/40/40`} className="w-10 h-10 rounded-xl" referrerPolicy="no-referrer" />
                         <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#1e293b] rounded-full" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white leading-tight">د. أحمد الشامي</p>
                         <p className="text-[10px] text-slate-500 mt-1 italic font-medium">استشاري باطنية</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-600" />
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-white font-bold text-sm">المواعيد القادمة فوراً</h3>
                 <button className="text-indigo-400 text-[10px] font-black uppercase tracking-tighter hover:underline">عرض الكل ({appointments.length})</button>
              </div>
              <div className="space-y-4">
                 {appointments.slice(0, 4).map(app => (
                   <div key={app.id} className="p-4 glass-card rounded-2xl border-r-4 border-indigo-500/50">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{app.time}</span>
                         <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-black">مجدول</span>
                      </div>
                      <p className="text-xs font-bold text-white">{app.patientName}</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">{app.type === 'consultation' ? 'معاينة أخصائي' : 'متابعة دورية'}</p>
                   </div>
                 ))}
                 {appointments.length === 0 && (
                   <div className="text-center py-6">
                      <Calendar size={32} className="mx-auto text-slate-700 mb-3 opacity-20" />
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">لا توجد مواعيد نشطة حالياً</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="text-right">
       <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5 italic tracking-tighter">{label}</p>
       <p className={cn("text-xs font-black", `text-${color}-400`)}>{value}</p>
    </div>
  );
}

function DashboardAlert({ type, title, desc }: { type: 'danger' | 'warning' | 'info', title: string, desc: string, key?: React.Key }) {
  const styles = {
    danger: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    info: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  };
  
  return (
    <div className={cn("p-4 rounded-2xl border", styles[type])}>
       <div className="flex items-center gap-2 mb-1">
          <div className={cn("w-1.5 h-1.5 rounded-full", type === 'danger' ? "bg-rose-500 animate-pulse" : "bg-current")} />
          <h4 className="text-[11px] font-black uppercase tracking-widest">{title}</h4>
       </div>
       <p className="text-[10px] leading-relaxed opacity-80">{desc}</p>
    </div>
  );
}
