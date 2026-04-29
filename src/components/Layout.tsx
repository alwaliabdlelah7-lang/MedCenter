import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';
import { dataStore } from '../services/dataService';

// ... rest of imports ...
import { 
  BarChart3, 
  Users, 
  Stethoscope, 
  Building2, 
  Syringe, 
  Settings, 
  ClipboardList, 
  Activity as ActivityIcon, 
  LayoutDashboard,
  Receipt,
  Bed,
  LogOut,
  Hospital,
  Printer,
  Calendar,
  Pill,
  FlaskConical,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  ListOrdered,
  UsersRound,
  FileHeart,
  History as HistoryIcon,
  Cloud,
  Database,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import CommandSearch from './CommandSearch';

const sidebarItems: { icon?: any, label: string, path?: string, type?: 'header', permission?: Permission | Permission[] }[] = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/', permission: 'all' },
  { icon: FileHeart, label: 'إدارة المرضى (EMR)', path: '/patients', permission: ['clinical', 'registration'] as Permission[] },
  { icon: Calendar, label: 'المواعيد والحجوزات', path: '/appointments', permission: ['clinical', 'registration'] as Permission[] },
  { icon: ListOrdered, label: 'قائمة الانتظار الذكية', path: '/queue', permission: ['clinical', 'registration'] as Permission[] },
  { icon: ClipboardList, label: 'أرشيف الزيارات السريرية', path: '/clinical-visits', permission: 'clinical' },
  { icon: MessageSquare, label: 'محادثات الموظفين', path: '/chat', permission: 'all' },
  
  { label: 'الأدلة والنظام', type: 'header', permission: 'admin' },
  { icon: Stethoscope, label: 'دليل الأطباء', path: '/directories/doctors', permission: 'admin' },
  { icon: UsersRound, label: 'دليل الممرضين', path: '/directories/nurses', permission: 'admin' },
  { icon: Building2, label: 'دليل الأقسام', path: '/directories/departments', permission: 'admin' },
  { icon: ActivityIcon, label: 'دليل العيادات', path: '/directories/clinics', permission: 'admin' },
  { icon: ActivityIcon, label: 'دليل الخدمات', path: '/directories/services', permission: 'admin' },
  { icon: Syringe, label: 'دليل العمليات', path: '/directories/operations', permission: 'admin' },
  { icon: FlaskConical, label: 'دليل بنود المختبر', path: '/directories/lab', permission: 'admin' },
  { icon: Pill, label: 'دليل أصناف الصيدلية', path: '/directories/pharmacy', permission: 'admin' },
  { icon: Users, label: 'دليل المرافقين', path: '/directories/companions', permission: 'admin' },
  
  { label: 'العمليات السريرية', type: 'header', permission: ['clinical', 'pharmacy', 'lab'] as Permission[] },
  { icon: Sparkles, label: 'مساعد التشخيص الذكي', path: '/diagnosis-assistant', permission: 'clinical' },
  { icon: Pill, label: 'الصيدلية والمخزن', path: '/pharmacy', permission: 'pharmacy' },
  { icon: FlaskConical, label: 'المختبرات والتحاليل', path: '/laboratory', permission: 'lab' },
  { icon: ImageIcon, label: 'الأشعة والتصوير', path: '/radiology', permission: 'clinical' },
  { icon: Bed, label: 'إدارة الرقود', path: '/inpatient', permission: 'clinical' },
  
  { label: 'الإدارة والتقارير', type: 'header', permission: 'all' },
  { icon: ClipboardList, label: 'سندات الاستعلامات', path: '/transactions/receipts', permission: ['billing', 'admin'] as Permission[] },
  { icon: Receipt, label: 'تحصيل السندات الآجلة', path: '/transactions/deferred', permission: ['billing', 'admin'] as Permission[] },
  { icon: HistoryIcon, label: 'مرتجع سندات الاستعلامات', path: '/transactions/returns', permission: ['billing', 'admin'] as Permission[] },
  { icon: BarChart3, label: 'نسب الأطباء من الخدمات', path: '/reports/doctor-commissions', permission: 'admin' },
  { icon: UsersRound, label: 'المستخدمين والصلاحيات', path: '/users', permission: 'admin' },
  { icon: Receipt, label: 'التقارير المالية', path: '/reports', permission: 'admin' },
  { icon: Settings, label: 'إعدادات النظام', path: '/settings', permission: 'admin' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hospitalName, setHospitalName] = useState('إبداع الطبي');
  const [isCloudMode, setIsCloudMode] = useState(dataStore.isCloudEnabled());

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setIsCloudMode(dataStore.isCloudEnabled());
    });

    const saved = localStorage.getItem('hospital_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.hospitalName) setHospitalName(settings.hospitalName);
    }
    
    // Fallback to separate key if exists
    const separateName = localStorage.getItem('hospital_name');
    if (separateName) setHospitalName(separateName);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === '/' && !isSearchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, [isSearchOpen]);

  return (
    <div className="flex min-h-screen font-sans p-4 gap-4 overflow-hidden relative">
      <div className="mesh-bg" />
      
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 100 : 288 }}
        className="glass rounded-2xl flex flex-col p-4 transition-all duration-300 relative z-50 shadow-2xl"
      >
        <div className="p-4 flex items-center gap-3 mb-8 overflow-hidden">
          <div className="min-w-[40px] w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/50">
            <Hospital size={24} />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
              <h1 className="font-bold text-lg text-white leading-none">{hospitalName}</h1>
              <p className="text-[10px] text-sky-300 mt-1 uppercase tracking-wider">نظام إدارة المستشفيات</p>
            </motion.div>
          )}
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-20 w-6 h-6 glass bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-sky-500 hover:scale-110 transition-all border border-white/20"
        >
          {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {sidebarItems.filter(item => !item.permission || hasPermission(item.permission)).map((item, idx) => {
            if (item.type === 'header') {
              return !isCollapsed ? (
                <div key={idx} className="text-slate-500 text-[9px] font-black uppercase tracking-[2px] px-4 mt-8 mb-2 italic">
                  {item.label}
                </div>
              ) : (
                <div key={idx} className="h-0.5 bg-white/5 my-6 mx-4" />
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                title={isCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  cn(
                    "sidebar-link group",
                    isActive ? "sidebar-link-active" : "sidebar-link-inactive",
                    isCollapsed && "justify-center px-0"
                  )
                }
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isCollapsed ? "m-0" : "")} />
                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 mt-auto border-t border-white/5 pt-4">
          {!isCollapsed ? (
            <>
              <div className={cn(
                "glass-card p-3 rounded-xl flex items-center justify-between mb-4 overflow-hidden border-r-4 transition-all",
                isCloudMode ? "border-emerald-500 bg-emerald-500/5" : "border-rose-500 bg-rose-500/5"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isCloudMode ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap">
                    {isCloudMode ? 'متصل بالسيرفر (Cloud)' : 'وضع العمل المحلي (Offline)'}
                  </span>
                </div>
                {isCloudMode ? <Cloud size={14} className="text-emerald-400" /> : <Database size={14} className="text-rose-400" />}
              </div>
              <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium"
              >
                <LogOut size={20} />
                <span>تسجيل الخروج</span>
              </button>
              <div className="mt-4 text-center">
                 <p className="text-[10px] text-slate-600 font-black uppercase tracking-[2px] italic">
                   الإصدار: {import.meta.env.VITE_APP_VERSION || '1.0.0'}
                 </p>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center gap-4">
               <div className={cn("w-2 h-2 rounded-full animate-pulse", isCloudMode ? "bg-emerald-500" : "bg-rose-500")} />
               <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
               >
                  <LogOut size={20} />
               </button>
               <span className="text-[8px] text-slate-700 font-bold rotate-90 whitespace-nowrap mt-4 tracking-widest">
                 V{import.meta.env.VITE_APP_VERSION || '1.0.0'}
               </span>
             </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-4 min-w-0">
        <header className="glass rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-sky-950/20">
          <div className="flex items-center gap-4 flex-1 max-w-2xl px-4 lg:px-8">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="relative w-full group cursor-pointer"
            >
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-sky-400 transition-colors pointer-events-none">
                <Search size={20} />
              </div>
              <div className="w-full pr-12 pl-16 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-slate-500 transition-all text-sm flex items-center">
                بحث سريع (مريض، طبيب، موعد...) اضغط / للبدء
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-2 py-1 glass bg-white/5 border border-white/20 rounded-lg text-[10px] text-slate-400 font-mono">CTRL</kbd>
                <kbd className="px-2 py-1 glass bg-white/5 border border-white/20 rounded-lg text-[10px] text-slate-400 font-mono">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 glass-card rounded-xl">
               <div className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest italic",
                 isCloudMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
               )}>
                 {isCloudMode ? <Cloud size={12} /> : <Database size={12} />}
                 {isCloudMode ? 'Cloud Online' : 'Local Offline'}
               </div>
               <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-white relative group"
               >
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#1e293b]" />
               </button>
               <button className="p-2 text-slate-400 hover:text-white">
                 <Search size={20} />
               </button>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-white">{user?.name || 'مستخدم النظام'}</span>
                <span className="text-[10px] text-sky-400 font-bold px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full italic">{user?.role === 'admin' ? 'مدير النظام' : user?.role || 'موظف'}</span>
              </div>
              <div className="w-10 h-10 rounded-full glass-card border-2 border-white/10 overflow-hidden shadow-xl ring-2 ring-sky-500/20">
                <img src={`https://picsum.photos/seed/${user?.username || 'user'}/100/100`} alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-full pb-4"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed left-4 top-4 bottom-4 w-96 glass bg-slate-900/95 rounded-3xl z-[101] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                     <Bell size={20} />
                   </div>
                   <h3 className="text-white font-bold">التنبيهات والطلبات</h3>
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                <NotificationItem 
                  title="مريض جديد بالانتظار" 
                  desc="الاسم: عبدالله محمد - عيادة القلب" 
                  time="منذ دقيقة" 
                  type="info"
                />
                <NotificationItem 
                  title="طلب تحليل مخبري" 
                  desc="غرفة الطوارئ 04 - فحص شامل" 
                  time="منذ 5 دقائق" 
                  type="warning"
                />
                <NotificationItem 
                  title="تم سداد سند استعلام" 
                  desc="المبلغ: 5,000 ر.ي - كود 442" 
                  time="منذ 12 دقيقة" 
                  type="success"
                />
                <NotificationItem 
                  title="انخفاض مخزون أدوية" 
                  desc="مادة 'أوميبرازول' شارفت على النفاد" 
                  time="منذ ساعة" 
                  type="danger"
                />
              </div>

              <button className="mt-6 py-4 glass-card text-sky-400 text-xs font-bold rounded-2xl hover:bg-white/5 transition-colors">
                عرض كافة التنبيهات والأرشيف
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ title, desc, time, type }: { title: string, desc: string, time: string, type: 'info' | 'warning' | 'success' | 'danger' }) {
  const iconMap = {
    info: <ActivityIcon className="text-sky-400" size={16} />,
    warning: <Clock className="text-amber-400" size={16} />,
    success: <CheckCircle2 className="text-emerald-400" size={16} />,
    danger: <Settings className="text-rose-400" size={16} />,
  };

  const borderMap = {
    info: 'border-sky-500',
    warning: 'border-amber-500',
    success: 'border-emerald-500',
    danger: 'border-rose-500',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card p-4 rounded-2xl border-l-4 group cursor-pointer hover:translate-x-1 transition-all", borderMap[type])}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{iconMap[type]}</div>
        <div className="flex-1">
          <p className="text-white text-xs font-bold leading-none">{title}</p>
          <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed">{desc}</p>
          <span className="text-[9px] text-slate-500 mt-2 block font-medium uppercase tracking-widest">{time}</span>
        </div>
      </div>
    </motion.div>
  );
}
