import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
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
  UserPlus,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Doctor, Clinic, Patient } from '../types';
import { cn } from '../lib/utils';
import { INITIAL_PATIENTS } from '../data/seedData';
import { dataStore } from '../services/dataService';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addDays,
  parseISO,
  isBefore,
  startOfToday
} from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [apptsData, doctorsData, clinicsData, patientsData] = await Promise.all([
          dataStore.getAll<Appointment>('appointments'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Clinic>('clinics'),
          dataStore.getAll<Patient>('patients')
        ]);
        setAppointments(apptsData);
        setDoctors(doctorsData);
        setClinics(clinicsData);
        setPatients(patientsData.length > 0 ? patientsData : INITIAL_PATIENTS);
      } catch (error) {
        console.error("Failed to load appointments data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<Appointment | null>(null);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.patientName && !newAppointment.patientId) return;
    
    const selectedDoctor = doctors.find(d => d.id === newAppointment.doctorId) || doctors[0];
    const cost = newAppointment.type === 'consultation' ? selectedDoctor.consultationFee : selectedDoctor.followupFee;

    const appointment: Appointment = {
      id: `APT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: newAppointment.patientId || `P-${Math.random().toString(36).substr(2, 4)}`,
      patientName: newAppointment.patientName!,
      doctorId: (newAppointment.doctorId || doctors[0]?.id || '') as string,
      clinicId: (newAppointment.clinicId || clinics[0]?.id || '') as string,
      date: newAppointment.date!,
      time: newAppointment.time!,
      status: 'scheduled',
      type: newAppointment.type as any || 'visit',
      cost: cost,
      isPaid: false
    };
    
    await dataStore.addItem('appointments', appointment);
    setAppointments([...appointments, appointment]);
    setShowAddModal(false);
    setNewAppointment({
      patientId: '',
      patientName: '',
      doctorId: '',
      clinicId: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      type: 'visit',
      status: 'scheduled'
    });
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const updates: Partial<Appointment> = { status };
    const doctor = doctors.find(d => d.id === appointment.doctorId);

    if (status === 'completed') {
      if (doctor) {
        if (!appointment.cost || appointment.cost === 0) {
          updates.cost = appointment.type === 'consultation' ? doctor.consultationFee : (appointment.type === 'followup' ? doctor.followupFee : 0);
        }
        if (doctor.returnDays > 0) {
          const returnDate = new Date();
          returnDate.setDate(returnDate.getDate() + doctor.returnDays);
          updates.returnDate = returnDate.toISOString().split('T')[0];
        }
      }
    }

    if (status === 'waiting' && doctor) {
      if (!appointment.isPaid && appointment.type !== 'visit') {
        const cost = appointment.cost || (appointment.type === 'consultation' ? doctor.consultationFee : doctor.followupFee);
        const receipt = {
          id: `REC-${Date.now().toString().slice(-6)}`,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patientAge: 30,
          serviceId: appointment.type === 'consultation' ? 'service-consult' : 'service-followup',
          doctorId: appointment.doctorId,
          amount: cost,
          paymentMethod: 'cash' as const,
          date: new Date().toLocaleDateString('ar-YE'),
          status: 'paid' as const
        };
        await dataStore.addItem('receipts', receipt);
        updates.isPaid = true;
        updates.cost = cost;
      }
    }

    await dataStore.updateItem<Appointment>('appointments', id, updates);
    setAppointments(appointments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
    await dataStore.updateItem<Appointment>('appointments', id, { status: 'cancelled' });
    setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRescheduleModal) return;
    
    const updates = { 
      date: newAppointment.date, 
      time: newAppointment.time,
      status: 'scheduled' as const
    };

    await dataStore.updateItem<Appointment>('appointments', showRescheduleModal.id, updates);
    setAppointments(appointments.map(a => a.id === showRescheduleModal.id ? { ...a, ...updates } : a));
    setShowRescheduleModal(null);
  };

  const filtered = appointments.filter(a => 
    (activeTab === 'all' || a.status === activeTab) &&
    (a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calendar Logic
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getTimeSlots = (doctorId: string, date: string) => {
    const slots = [];
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return [];
    
    // Convert 08:00 to 14:00 into slots
    let [startHour, startMin] = doctor.workingHours.start.split(':').map(Number);
    let [endHour, endMin] = doctor.workingHours.end.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    while (current < endTime) {
      const timeStr = format(current, 'HH:mm');
      const isBusy = appointments.some(a => a.doctorId === doctorId && a.date === date && a.time === timeStr && a.status !== 'cancelled');
      slots.push({ time: timeStr, isBusy });
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة الحجوزات المتقدمة</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">جدولة المواعيد، تتبع الحالات، وإرسال التنبيهات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white")}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'calendar' ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white")}
            >
              <CalendarDays size={20} />
            </button>
          </div>

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
            <span>حجز موعد جديد</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'all', name: 'الكل' },
          { id: 'scheduled', name: 'مجدول' },
          { id: 'waiting', name: 'في الانتظار' },
          { id: 'completed', name: 'مكتمل' },
          { id: 'cancelled', name: 'ملغي' },
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

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((apt) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={apt.id}
                className={cn(
                  "glass p-6 rounded-[35px] relative group border border-white/5 overflow-hidden flex flex-col justify-between h-auto transition-all",
                  apt.status === 'cancelled' && "opacity-60 grayscale"
                )}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl glass bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/10">
                      <CalendarIcon size={28} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white truncate">{apt.patientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-tighter">#{apt.id}</span>
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md">{apt.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono text-slate-400 font-black border border-white/5">
                        <Clock size={12} className="text-sky-500" />
                        {apt.time}
                     </div>
                     <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black italic",
                        apt.type === 'consultation' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {apt.type === 'consultation' ? 'معاينة' : 'متابعة'}
                      </span>
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
                   {apt.status !== 'cancelled' && (
                     <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                        <span className="text-slate-500 flex items-center gap-2 font-bold"><DollarSign size={14} className="text-emerald-400" /> الرسوم</span>
                        <span className="text-white font-black">{apt.cost?.toLocaleString() || '0'} ر.ي</span>
                     </div>
                   )}
                </div>

                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/10 gap-2">
                  <div className="flex gap-2">
                     {apt.status === 'scheduled' && (
                       <>
                        <button 
                          onClick={() => updateStatus(apt.id, 'waiting')}
                          className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-black rounded-lg text-[10px] font-black hover:bg-amber-400 transition-all"
                        >
                          <UserCheck size={14} /> وصول
                        </button>
                        <button 
                          onClick={() => {
                            setNewAppointment({ ...apt });
                            setShowRescheduleModal(apt);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5"
                        >
                          <RefreshCw size={14} /> إعادة جدولة
                        </button>
                       </>
                     )}
                     {apt.status === 'waiting' && (
                       <button 
                        onClick={() => updateStatus(apt.id, 'completed')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
                       >
                         <CheckCircle2 size={14} /> إنهاء
                       </button>
                     )}
                     {apt.status === 'completed' && apt.returnDate && (
                       <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1 italic">
                          <RefreshCw size={12} className="animate-spin-slow" />
                          عودة حتى: {apt.returnDate}
                       </div>
                     )}
                  </div>
                  
                  <div className="flex gap-1">
                     {apt.status === 'scheduled' && (
                       <button 
                        onClick={() => cancelAppointment(apt.id)}
                        className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all"
                       >
                        <Trash2 size={16} />
                       </button>
                     )}
                     <button className="p-2 glass-card rounded-xl text-slate-500 hover:text-emerald-400 transition-all"><Smartphone size={16} /></button>
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
               <CalendarIcon size={64} className="mb-4 text-slate-700" />
               <p className="text-xl font-black text-slate-600 tracking-[10px] uppercase">لا توجد حجوزات</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-[40px] border border-white/5 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <CalendarIcon className="text-sky-500" />
              {format(currentMonth, 'MMMM yyyy', { locale: ar })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 glass bg-white/5 rounded-xl text-white hover:bg-white/10"
              >
                <ChevronRight size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 glass bg-white/5 rounded-xl text-sm font-bold text-sky-400 hover:bg-white/10 transition-all"
              >
                اليوم
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 glass bg-white/5 rounded-xl text-white hover:bg-white/10"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
              <div key={day} className="text-center text-xs font-black text-slate-500 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {calendarDays.map((day, idx) => {
              const dayAppts = appointments.filter(a => isSameDay(parseISO(a.date), day) && a.status !== 'cancelled');
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div 
                  key={idx}
                  className={cn(
                    "min-h-[140px] p-4 flex flex-col transition-all group relative",
                    isCurrentMonth ? "bg-slate-900/40" : "bg-slate-950/20 opacity-30",
                    isToday && "ring-1 ring-inset ring-sky-500/50 bg-sky-500/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                      isToday ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30" : isCurrentMonth ? "text-slate-300" : "text-slate-600"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                        {dayAppts.length} حجز
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                    {dayAppts.slice(0, 3).map(apt => (
                      <div 
                        key={apt.id}
                        onClick={() => {
                           // Navigate or show details
                        }}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold truncate transition-all cursor-pointer",
                          apt.status === 'scheduled' ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20" :
                          apt.status === 'waiting' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        )}
                      >
                        <span className="font-mono mr-1">{apt.time}</span> {apt.patientName}
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-[8px] font-black text-slate-500 text-center uppercase pt-1">
                        + {dayAppts.length - 3} المزيد
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                        setNewAppointment({...newAppointment, date: format(day, 'yyyy-MM-dd')});
                        setShowAddModal(true);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-sky-600/5 flex items-center justify-center transition-all"
                  >
                    <Plus className="text-sky-500 scale-150" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking / Reschedule Modals */}
      <AnimatePresence>
        {(showAddModal || showRescheduleModal) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false);
                setShowRescheduleModal(null);
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-8 border border-white/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black text-white border-r-4 border-sky-500 pr-5">
                      {showRescheduleModal ? 'إعادة جدولة الموعد' : 'حجز موعد طبي جديد'}
                   </h3>
                   <button 
                    onClick={() => { setShowAddModal(false); setShowRescheduleModal(null); }}
                    className="p-3 glass bg-white/5 rounded-2xl text-slate-400 hover:text-white"
                   >
                     <XCircle size={24} />
                   </button>
                </div>

                <form onSubmit={showRescheduleModal ? handleReschedule : handleAdd} className="space-y-6">
                  {!showRescheduleModal && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <User size={14} className="text-sky-500" /> مريض من السجل أو جديد
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3 relative">
                          <input 
                            list="patients-list" 
                            required 
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 transition-all" 
                            value={newAppointment.patientName} 
                            onChange={(e) => {
                               const p = patients.find(patient => patient.name === e.target.value);
                               setNewAppointment({...newAppointment, patientName: e.target.value, patientId: p?.id || ''});
                            }} 
                            placeholder="ابحث عن مريض أو اكتب الاسم..." 
                          />
                          <datalist id="patients-list">
                             {patients.map(p => <option key={p.id} value={p.name} />)}
                          </datalist>
                        </div>
                        <button type="button" className="glass bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center hover:bg-sky-500/20 transition-all border border-sky-500/20">
                          <UserPlus size={22}/>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Stethoscope size={14} className="text-indigo-400" /> الطبيب المعالج
                      </label>
                      <select 
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none cursor-pointer focus:border-indigo-500 transition-all" 
                        value={newAppointment.doctorId} 
                        onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value, time: ''})}
                        disabled={!!showRescheduleModal}
                      >
                        <option className="bg-slate-900" value="">اختر الطبيب...</option>
                        {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={14} className="text-sky-400" /> العيادة / القسم
                      </label>
                      <select 
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none cursor-pointer focus:border-sky-500 transition-all" 
                        value={newAppointment.clinicId} 
                        onChange={(e) => setNewAppointment({...newAppointment, clinicId: e.target.value})}
                        disabled={!!showRescheduleModal}
                      >
                        {clinics.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <CalendarIcon size={14} className="text-emerald-400" /> تاريخ الموعد
                      </label>
                      <input 
                        type="date" 
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-mono text-sm focus:border-emerald-500 transition-all" 
                        value={newAppointment.date} 
                        onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value, time: ''})} 
                      />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Filter size={14} className="text-amber-400" /> نوع الزيارة
                        </label>
                        <select 
                          className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold appearance-none cursor-pointer focus:border-amber-500 transition-all" 
                          value={newAppointment.type} 
                          onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value as any})}
                          disabled={!!showRescheduleModal}
                        >
                          <option className="bg-slate-900" value="consultation">معاينة أولى (Consultation)</option>
                          <option className="bg-slate-900" value="followup">متابعة دوریة (Follow-up)</option>
                          <option className="bg-slate-900" value="visit">زيارة عودة (Return)</option>
                        </select>
                    </div>
                  </div>

                  {newAppointment.doctorId && newAppointment.date && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">الأوقات المتاحة للحجز</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {getTimeSlots(newAppointment.doctorId, newAppointment.date).map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBusy}
                            onClick={() => setNewAppointment({...newAppointment, time: slot.time})}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-black transition-all border",
                              slot.isBusy ? "bg-rose-500/10 text-rose-500/30 border-rose-500/10 cursor-not-allowed" :
                              newAppointment.time === slot.time ? "bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/30" :
                              "glass bg-white/5 text-slate-400 border-white/10 hover:border-sky-500 hover:text-white"
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={!newAppointment.time || (!showRescheduleModal && !newAppointment.patientName)}
                      className="flex-3 py-4 bg-sky-600 text-white rounded-[20px] font-black shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      {showRescheduleModal ? 'تحديث الموعد' : 'تأكيد الحجز النهائي'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setShowAddModal(false); setShowRescheduleModal(null); }} 
                      className="flex-1 py-4 glass bg-white/5 text-slate-500 rounded-[20px] font-black hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
