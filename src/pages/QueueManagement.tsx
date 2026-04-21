import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  UserPlus, 
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  Stethoscope,
  Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Doctor } from '../types';
import { cn } from '../lib/utils';

export default function QueueManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('hospital_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  
  useEffect(() => {
    localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const updateStatus = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
  };

  const filtered = appointments.filter(a => 
    (selectedDoctor === 'all' || a.doctorId === selectedDoctor) &&
    ['waiting', 'in_consultation', 'scheduled'].includes(a.status)
  ).sort((a, b) => {
    // Sort by status priority: in_consultation first, then waiting, then scheduled
    const priority: Record<string, number> = { in_consultation: 0, waiting: 1, scheduled: 2 };
    return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
  });

  const getWaitStats = () => {
    const waitingCount = appointments.filter(a => a.status === 'waiting').length;
    return {
      waiting: waitingCount,
      estimatedMinutes: waitingCount * 15, // Assume 15 mins per patient
      active: appointments.filter(a => a.status === 'in_consultation').length
    };
  };

  const stats = getWaitStats();

  return (
    <div className="space-y-8 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة قائمة الانتظار الذكية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">تنظيم تدفق المرضى، تتبع حالة العيادات، وتقدير وقت الانتظار</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="flex flex-col items-center border-l border-white/10 pl-4">
                 <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">في الانتظار</span>
                 <span className="text-xl font-black text-amber-400">{stats.waiting}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">وقت الانتظار المتوقع</span>
                 <span className="text-xl font-black text-white">{stats.estimatedMinutes} دقيقة</span>
              </div>
           </div>
           <select 
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="glass bg-white/5 px-4 py-3 rounded-xl text-white outline-none border border-white/10 font-bold focus:border-sky-500"
           >
              <option value="all" className="bg-slate-900">جميع الأطباء / العيادات</option>
              {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((app, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={app.id}
                className={cn(
                  "p-6 rounded-3xl relative overflow-hidden transition-all border",
                  app.status === 'in_consultation' 
                    ? "glass bg-indigo-500/10 border-indigo-500/30 ring-2 ring-indigo-500/20" 
                    : "glass border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="text-center min-w-[60px] border-l border-white/10 pl-6 space-y-1">
                         <span className="text-sm font-black text-white block">#{index + 1}</span>
                         <span className="text-[10px] text-slate-500 font-mono uppercase italic">{app.time}</span>
                      </div>
                      
                      <div>
                         <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-white">{app.patientName}</h3>
                            {app.status === 'in_consultation' && (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-full animate-pulse">
                                 <ActivityIcon size={10} /> جاري الكشف
                              </span>
                            )}
                            {app.status === 'waiting' && <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-full italic">في الانتظار</span>}
                         </div>
                         <div className="flex items-center gap-4 mt-2">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                               <Stethoscope size={14} className="text-indigo-400" />
                               {doctors.find(d => d.id === app.doctorId)?.name}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                               <ShieldAlert size={14} className="text-sky-400" />
                               {app.type === 'consultation' ? 'معاينة جديدة' : 'متابعة'}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2">
                      {app.status === 'scheduled' && (
                        <button 
                         onClick={() => updateStatus(app.id, 'waiting')}
                         className="flex items-center gap-2 px-5 py-2.5 glass bg-amber-500/10 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all"
                        >
                           تأكيد الحضور
                        </button>
                      )}
                      {app.status === 'waiting' && (
                        <button 
                         onClick={() => updateStatus(app.id, 'in_consultation')}
                         className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                        >
                           <Play size={14} /> دخول العيادة
                        </button>
                      )}
                      {app.status === 'in_consultation' && (
                        <button 
                         onClick={() => updateStatus(app.id, 'completed')}
                         className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                        >
                           <CheckCircle2 size={14} /> إنهاء وزيارة الصيدلية
                        </button>
                      )}
                      <button className="p-2 text-slate-500 hover:text-white glass rounded-xl"><MoreVertical size={18} /></button>
                   </div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
                 <Users size={64} className="mb-4 text-slate-700" />
                 <p className="text-lg font-bold text-slate-600 tracking-widest">لا توجد حالات في قائمة الانتظار لهذه العيادة</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Informational Widget */}
        <div className="space-y-6">
           <div className="glass p-8 rounded-[40px] border border-white/5 bg-indigo-600 shadow-2xl shadow-indigo-600/20 text-white">
              <h3 className="text-xl font-black mb-4">تعليمات التدفق الذكي</h3>
              <ul className="space-y-4 text-xs font-medium opacity-90">
                 <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div>
                    <p>قم بتأكيد حضور المريض فور وصوله لقاعة الانتظار للانتقال للحالة (في الانتظار).</p>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                    <p>عند دخول المريض للعيادة، غير حالته إلى (جاري الكشف) ليتم تنبيه الطبيب والمنظومة بالانشغال.</p>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                    <p>يتم حساب زمن الكشف تلقائياً لتحسين تقدير وقت الانتظار للمرضى الآخرين.</p>
                 </li>
              </ul>
              <button className="w-full mt-8 py-4 glass bg-white/20 rounded-2xl font-black text-sm hover:bg-white/30 transition-all">تفعيل الإشعارات الصوتية</button>
           </div>

           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                 <ShieldAlert size={18} className="text-amber-400" />
                 إدارة الأولويات
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-rose-500/20">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-2">
                       <AlertCircle size={14}/> حالة طارئة (Critical)
                    </span>
                    <button className="text-[10px] font-black text-slate-400 underline">تعديل الترتيب</button>
                 </div>
                 <div className="p-6 text-center text-slate-600 italic text-[10px]">
                    يمكنك سحب وإفلات البطاقات (قريباً) لتغيير أولوية المريض يدوياً في القائمة.
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
