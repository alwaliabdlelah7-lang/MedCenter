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
  Activity as ActivityIcon,
  Plus,
  ClipboardList,
  FlaskConical,
  Beaker,
  FileText,
  RefreshCw,
  Volume2,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Doctor, Patient, ClinicalVisit } from '../types';
import { cn } from '../lib/utils';
import { dataStore } from '../services/dataService';

export default function QueueManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  
  // Clinical Visit Modal State
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [activeVisit, setActiveVisit] = useState<Partial<ClinicalVisit>>({});
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [apptsData, doctorsData, patientsData] = await Promise.all([
          dataStore.getAll<Appointment>('appointments'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Patient>('patients')
        ]);
        setAppointments(apptsData);
        setDoctors(doctorsData);
        setPatients(patientsData);
      } catch (error) {
        console.error("Failed to load queue data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const updates: Partial<Appointment> = { status };
    const doctor = doctors.find(d => d.id === appointment.doctorId);

    // Automation for completed status
    if (status === 'completed' && doctor) {
      if (!appointment.cost) {
        updates.cost = appointment.type === 'consultation' ? doctor.consultationFee : doctor.followupFee;
      }
      if (doctor.returnDays > 0) {
        const rDate = new Date();
        rDate.setDate(rDate.getDate() + doctor.returnDays);
        updates.returnDate = rDate.toISOString().split('T')[0];
      }
    }

    await dataStore.updateItem<Appointment>('appointments', id, updates);
    setAppointments(appointments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleStartConsultation = (apt: Appointment) => {
    setSelectedApt(apt);
    setActiveVisit({
      patientId: apt.patientId,
      patientName: apt.patientName,
      doctorId: apt.doctorId,
      clinicId: apt.clinicId,
      vitals: { temp: '37', bp: '120/80', hr: '75' },
      diagnosis: '',
      treatmentPlan: '',
      prescriptions: [],
      labOrders: [],
      radOrders: []
    });
    updateStatus(apt.id, 'in_consultation');
    setShowVisitModal(true);
  };

  const handleSaveVisit = async () => {
    if (!selectedApt) return;
    
    const visit: ClinicalVisit = {
      ...activeVisit as ClinicalVisit,
      id: `VIS-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    };

    // Save clinical visit
    await dataStore.addItem('clinical_visits', visit);

    // INTEGRATION: Push orders to Laboratory and Pharmacy
    if (visit.labOrders && visit.labOrders.length > 0) {
      for (const testId of visit.labOrders) {
        await dataStore.addItem('lab_tests', {
          id: `LAB-${Date.now().toString().slice(-6)}`,
          patientId: visit.patientId,
          patientName: visit.patientName,
          testId: testId,
          testType: 'فحص مخبري',
          doctorId: visit.doctorId,
          status: 'pending',
          date: new Date().toISOString()
        });
      }
    }

    if (visit.prescriptions && visit.prescriptions.length > 0) {
      await dataStore.addItem('prescriptions', {
        id: `RX-${Date.now().toString().slice(-6)}`,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        medicines: visit.prescriptions,
        status: 'pending',
        date: new Date().toISOString()
      });
    }

    if (visit.radOrders && visit.radOrders.length > 0) {
      for (const radType of visit.radOrders) {
        await dataStore.addItem('radiology_scans', {
          id: `RAD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 2)}`,
          patientId: visit.patientId,
          patientName: visit.patientName,
          doctorId: visit.doctorId,
          scanType: radType,
          status: 'pending',
          date: new Date().toISOString()
        });
      }
    }

    await updateStatus(selectedApt.id, 'completed');
    setShowVisitModal(false);
  };

  const filtered = appointments.filter(a => 
    (selectedDoctor === 'all' || a.doctorId === selectedDoctor) &&
    ['waiting', 'in_consultation', 'scheduled'].includes(a.status)
  ).sort((a, b) => {
    const priority: Record<string, number> = { in_consultation: 0, waiting: 1, scheduled: 2 };
    return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
  });

  const callPatient = (name: string) => {
    // Basic Speech Synthesis for Calling
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance();
      msg.text = `Patient ${name}, please come to the clinic.`;
      msg.lang = 'en-US';
      window.speechSynthesis.speak(msg);
    }
  };

  const sendWhatsAppReminder = (phone: string, name: string) => {
    const text = `عزيزي ${name}، حان دورك الآن في العيادة. يرجى التوجه لغرفة الكشف.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const stats = {
    waiting: appointments.filter(a => a.status === 'waiting').length,
    estimatedMinutes: appointments.filter(a => a.status === 'waiting').length * 15,
    active: appointments.filter(a => a.status === 'in_consultation').length
  };

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
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => callPatient(app.patientName)}
                            className="p-2.5 glass bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all"
                            title="نداء صوتي"
                           >
                              <Volume2 size={16} />
                           </button>
                           <button 
                            onClick={() => {
                              const p = patients.find(p => p.id === app.patientId);
                              if (p) sendWhatsAppReminder(p.phone, app.patientName);
                            }}
                            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all"
                            title="تنبيه واتساب"
                           >
                              <MessageCircle size={16} />
                           </button>
                           <button 
                            onClick={() => updateStatus(app.id, 'in_consultation')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                           >
                              <Play size={14} /> دخول العيادة
                           </button>
                        </div>
                      )}
                      {app.status === 'in_consultation' && (
                        <button 
                         onClick={() => handleStartConsultation(app)}
                         className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                        >
                           <ActivityIcon size={14} /> مواصلة الكشف
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

      {/* Clinical Visit Modal */}
      <AnimatePresence>
        {showVisitModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVisitModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl glass bg-[#0f172a]/95 rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">جلسة الكشف الطبي الذكية</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-tighter">Patient: {activeVisit.patientName} • ID: {activeVisit.patientId}</p>
                  </div>
                </div>
                <button onClick={() => setShowVisitModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <RefreshCw className="animate-spin-slow" size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Vitals & Diagnosis */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Vitals Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <ActivityIcon size={14} className="text-rose-500" /> Vital Signs (المؤشرات الحيوية)
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 glass bg-white/5 rounded-2xl border border-white/5">
                           <label className="block text-[9px] font-bold text-slate-500 mb-2">درجة الحرارة (°C)</label>
                           <input type="text" className="w-full bg-transparent text-white font-mono text-xl outline-none" value={activeVisit.vitals?.temp} onChange={(e) => setActiveVisit({...activeVisit, vitals: {...activeVisit.vitals!, temp: e.target.value}})} />
                        </div>
                        <div className="p-4 glass bg-white/5 rounded-2xl border border-white/5">
                           <label className="block text-[9px] font-bold text-slate-500 mb-2">ضغط الدم</label>
                           <input type="text" className="w-full bg-transparent text-white font-mono text-xl outline-none" value={activeVisit.vitals?.bp} onChange={(e) => setActiveVisit({...activeVisit, vitals: {...activeVisit.vitals!, bp: e.target.value}})} />
                        </div>
                        <div className="p-4 glass bg-white/5 rounded-2xl border border-white/5">
                           <label className="block text-[9px] font-bold text-slate-500 mb-2">نبض القلب (bpm)</label>
                           <input type="text" className="w-full bg-transparent text-white font-mono text-xl outline-none" value={activeVisit.vitals?.hr} onChange={(e) => setActiveVisit({...activeVisit, vitals: {...activeVisit.vitals!, hr: e.target.value}})} />
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis & Notes */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <ClipboardList size={14} className="text-sky-500" /> Clinical Diagnosis (التشخيص الطبي)
                      </h4>
                      <textarea 
                        className="w-full h-32 p-6 glass bg-white/5 border border-white/10 rounded-[30px] text-white outline-none focus:border-sky-500 font-bold leading-relaxed pr-8"
                        placeholder="اكتب التشخيص هنا..."
                        value={activeVisit.diagnosis}
                        onChange={(e) => setActiveVisit({...activeVisit, diagnosis: e.target.value})}
                      />
                      <textarea 
                        className="w-full h-24 p-6 glass bg-white/5 border border-white/10 rounded-[30px] text-white outline-none focus:border-slate-500 text-sm font-medium pr-8"
                        placeholder="ملاحظات إضافية أو توصيات طبيّة..."
                        value={activeVisit.treatmentPlan}
                        onChange={(e) => setActiveVisit({...activeVisit, treatmentPlan: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Right Column: Orders Integration */}
                  <div className="space-y-6">
                    {/* Lab & Radiology Orders */}
                    <div className="glass p-6 rounded-[35px] border border-white/10 space-y-4">
                       <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-white flex items-center gap-2">
                           <FlaskConical size={16} className="text-emerald-400" /> طلب فحوصات
                         </h4>
                         <button className="text-[10px] text-emerald-400 font-bold">+ إضافة</button>
                       </div>
                       <div className="space-y-2">
                          {['CBC (فحص دم شامل)', 'Urine (فحص بول)'].map((test, i) => (
                            <div key={i} className="flex items-center justify-between p-3 glass bg-white/5 rounded-xl text-[10px] text-slate-400 border border-white/5">
                               <span>{test}</span>
                               <CheckCircle2 size={12} className="text-slate-700" />
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Pharmacy Prescription */}
                    <div className="glass p-6 rounded-[35px] border border-white/10 space-y-4">
                       <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-white flex items-center gap-2">
                           <Beaker size={16} className="text-amber-400" /> وصِفة دويئة
                         </h4>
                         <button className="text-[10px] text-amber-400 font-bold">+ إضافة دواء</button>
                       </div>
                       <div className="space-y-2">
                          <div className="p-4 glass bg-white/5 rounded-xl text-center">
                             <p className="text-[10px] text-slate-500 italic">سيتم إرسال الوصفة مباشرة للصيدلية فور الحفظ</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-white/5 flex gap-4">
                <button 
                  onClick={handleSaveVisit}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-[30px] font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all uppercase tracking-[4px] text-sm"
                >
                  حفظ الجلسة وإصدار الأوامر الطبية
                </button>
                <button 
                  onClick={() => setShowVisitModal(false)}
                  className="px-10 py-5 glass bg-white/5 text-slate-500 rounded-[30px] font-black hover:bg-white/10 transition-all uppercase tracking-[2px] text-xs"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
