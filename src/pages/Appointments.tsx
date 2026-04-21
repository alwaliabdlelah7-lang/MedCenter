import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Stethoscope,
  DollarSign,
  Smartphone,
  MessageCircle,
  Bell,
  ArrowRight,
  MoreVertical,
  Filter,
  UserCheck,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Doctor, Clinic, Patient } from '../types';
import { cn } from '../lib/utils';
import { INITIAL_PATIENTS } from '../data/seedData';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('hospital_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  const [clinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('hospital_clinics');
    return saved ? JSON.parse(saved) : [];
  });

  const [patients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('hospital_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'waiting' | 'completed' | 'return'>('all');
  
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    patientId: '',
    patientName: '',
    doctorId: '',
    clinicId: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    type: 'visit',
    status: 'scheduled'
  });

  useEffect(() => {
    localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientName && !newAppointment.patientId) return;
    
    const selectedDoctor = doctors.find(d => d.id === newAppointment.doctorId) || doctors[0];
    const cost = newAppointment.type === 'consultation' ? selectedDoctor.consultationFee : selectedDoctor.followupFee;

    const appointment: Appointment = {
      id: `APT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: newAppointment.patientId || `P-${Math.random().toString(36).substr(2, 4)}`,
      patientName: newAppointment.patientName!,
      doctorId: newAppointment.doctorId || doctors[0]?.id || '',
      clinicId: newAppointment.clinicId || clinics[0]?.id || '',
      date: newAppointment.date!,
      time: newAppointment.time!,
      status: 'scheduled',
      type: newAppointment.type as any || 'visit',
      cost: cost,
      isPaid: false
    };
    
    setAppointments([...appointments, appointment]);
    setShowAddModal(false);
    setNewAppointment({ ...newAppointment, patientName: '', patientId: '' });
  };

  const updateStatus = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(a => {
      if (a.id === id) {
        const updated = { ...a, status };
        // If completed, automatically check for free return
        if (status === 'completed') {
          const doctor = doctors.find(d => d.id === a.doctorId);
          if (doctor && doctor.returnDays > 0) {
            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + doctor.returnDays);
            updated.returnDate = returnDate.toISOString().split('T')[0];
          }
        }
        return updated;
      }
      return a;
    }));
  };

  const filtered = appointments.filter(a => 
    (activeTab === 'all' || a.status === activeTab) &&
    (a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة الحجوزات المتقدمة</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">جدولة المواعيد، تتبع الحالات، وإرسال التنبيهات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث برقم الحجز أو الاسم..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-72 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>حجز موعد مسبق</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'all', name: 'الكل' },
          { id: 'scheduled', name: 'مجدول' },
          { id: 'waiting', name: 'في الانتظار' },
          { id: 'completed', name: 'مكتمل' },
          { id: 'return', name: 'زيارة عودة' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black transition-all",
              activeTab === tab.id ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((apt) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={apt.id}
              className="glass p-6 rounded-[35px] relative group border border-white/5 overflow-hidden flex flex-col justify-between h-auto"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl glass bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/10">
                    <Calendar size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{apt.patientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-tighter">#{apt.id}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black italic",
                        apt.type === 'consultation' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {apt.type === 'consultation' ? 'معاينة' : 'متابعة'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   <div className="p-2 glass bg-white/5 rounded-xl text-slate-500 group-hover:text-white transition-colors cursor-pointer"><MoreVertical size={16}/></div>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono text-slate-400 font-black">
                      <Clock size={12} className="text-sky-500" />
                      {apt.time}
                   </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2 font-bold"><Stethoscope size={14} className="text-indigo-400" /> الطبيب</span>
                    <span className="text-white font-black">{doctors.find(d => d.id === apt.doctorId)?.name || 'غير محدد'}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2 font-bold"><Building2 size={14} className="text-sky-400" /> العيادة</span>
                    <span className="text-white font-black">{clinics.find(c => c.id === apt.clinicId)?.name || 'العيادة الخارجية'}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                    <span className="text-slate-500 flex items-center gap-2 font-bold"><DollarSign size={14} className="text-emerald-400" /> الرسوم</span>
                    <span className="text-white font-black">{apt.cost?.toLocaleString() || '0'} ر.ي</span>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-2">
                <div className="flex gap-2">
                   {apt.status === 'scheduled' && (
                     <button 
                      onClick={() => updateStatus(apt.id, 'waiting')}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all uppercase"
                     >
                       <UserCheck size={14} /> وصول المريض
                     </button>
                   )}
                   {apt.status === 'waiting' && (
                     <button 
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all uppercase"
                     >
                       <CheckCircle2 size={14} /> إنهاء الكشف
                     </button>
                   )}
                   {apt.status === 'completed' && apt.returnDate && (
                     <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1 italic">
                        <RefreshCw size={12} className="animate-spin-slow" />
                        عودة مجانية حتى: {apt.returnDate}
                     </div>
                   )}
                </div>
                
                <div className="flex gap-1">
                   <button className="p-2 glass-card rounded-xl text-slate-500 hover:text-emerald-400 transition-all"><Smartphone size={16} /></button>
                   <button className="p-2 glass-card rounded-xl text-slate-500 hover:text-indigo-400 transition-all"><MessageCircle size={16} /></button>
                </div>
              </div>

              <div className={cn(
                "absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl text-[9px] font-black uppercase tracking-widest",
                apt.status === 'scheduled' ? "bg-sky-500 text-white" :
                apt.status === 'waiting' ? "bg-amber-500 text-black" :
                apt.status === 'completed' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                {apt.status}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/10 opacity-30">
             <Calendar size={64} className="mb-4 text-slate-700" />
             <p className="text-xl font-black text-slate-600 tracking-[10px] uppercase">No Appointments Found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right"
            >
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-sky-500 pr-5">حجز فوري / مسبق للعيادة</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">اختر المريض من السجل أو اكتب الاسم</label>
                  <div className="grid grid-cols-3 gap-2">
                     <input list="patients-list" required className="col-span-2 px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" value={newAppointment.patientName} onChange={(e) => setNewAppointment({...newAppointment, patientName: e.target.value})} placeholder="الاسم الكامل للمريض..." />
                     <datalist id="patients-list">
                        {patients.map(p => <option key={p.id} value={p.name} />)}
                     </datalist>
                     <button type="button" className="glass bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center hover:bg-sky-500/20 transition-all"><UserPlus size={20}/></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">الطبيب المختص</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none" value={newAppointment.doctorId} onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}>
                      <option className="bg-slate-900" value="">اختر الطبيب...</option>
                      {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">العيادة / القسم</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none" value={newAppointment.clinicId} onChange={(e) => setNewAppointment({...newAppointment, clinicId: e.target.value})}>
                      {clinics.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">نوع الموعد</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none" value={newAppointment.type} onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value as any})}>
                      <option className="bg-slate-900" value="consultation">معاينة أولى (Consultation)</option>
                      <option className="bg-slate-900" value="followup">متابعة دوریة (Follow-up)</option>
                      <option className="bg-slate-900" value="visit">زيارة عودة مجانية (Return)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">التاريخ والوقت</label>
                    <div className="flex gap-2">
                       <input type="date" className="flex-1 px-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-mono text-xs" value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} />
                       <input type="time" className="w-24 px-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-mono text-xs" value={newAppointment.time} onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/20 hover:bg-sky-500 transition-all uppercase tracking-[4px]">تثبيت الموعد</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-[4px]">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
