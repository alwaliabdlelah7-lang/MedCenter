import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Filter, 
  Download, 
  Calendar, 
  Phone, 
  FileText, 
  Activity as ActivityIcon, 
  Pill, 
  FlaskConical,
  X,
  History as HistoryIcon,
  TrendingUp,
  MapPin,
  Mail,
  Edit2,
  Trash2,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Appointment, LabTest, PharmacyItem, DynamicFieldDefinition } from '../types';
import { cn } from '../lib/utils';
import { INITIAL_PATIENTS } from '../data/seedData';
import { dataStore } from '../services/dataService';

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsData, fieldsData, apptsData, labsData] = await Promise.all([
          dataStore.getAll<Patient>('patients'),
          dataStore.getAll<DynamicFieldDefinition>('dynamic_fields'),
          dataStore.getAll<Appointment>('appointments'),
          dataStore.getAll<LabTest>('lab_tests')
        ]);
        setPatients(patientsData.length > 0 ? patientsData : INITIAL_PATIENTS);
        setDynamicFields(fieldsData);
        setAppointments(apptsData);
        setLabTests(labsData);
      } catch (error) {
        console.error("Failed to load patient management data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'emr' | 'history'>('profile');

  const [newPatientCustomFields, setNewPatientCustomFields] = useState<Record<string, any>>({});

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patientAppointments = selectedPatient ? appointments.filter(a => a.patientId === selectedPatient.id || a.patientName === selectedPatient.name) : [];
  const patientLabs = selectedPatient ? labTests.filter(l => l.patientName === selectedPatient.name) : [];

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newPatient: Patient = {
      id: `P-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      age: Number(formData.get('age')),
      gender: formData.get('gender') as 'male' | 'female',
      bloodType: formData.get('bloodType') as string,
      address: formData.get('address') as string,
      medicalHistory: [],
      customFields: newPatientCustomFields,
      createdAt: new Date().toISOString()
    };
    
    await dataStore.addItem('patients', newPatient);
    setPatients([newPatient, ...patients]);
    setShowAddModal(false);
    setNewPatientCustomFields({});
  };

  return (
    <div className="space-y-6 lg:p-4 text-right h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة المرضى والسجل الطبي</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">قاعدة بيانات المرضى الشاملة، ملفات EMR، وتتبع التاريخ الصحي</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم، الهاتف، أو المعرف..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-400 outline-none w-72 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <UserPlus size={20} />
            <span>تسجيل مريض جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]">
        {/* Patient List Section */}
        <div className="lg:col-span-4 glass rounded-[40px] overflow-hidden flex flex-col border border-white/10">
           <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                 <Users size={18} className="text-sky-400" /> قائمة المرضى
              </h3>
              <div className="flex items-center gap-1">
                 <button className="p-2 text-slate-500 hover:text-white glass rounded-lg"><Filter size={16} /></button>
                 <button className="p-2 text-slate-500 hover:text-white glass rounded-lg"><Download size={16} /></button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filtered.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={cn(
                    "w-full p-4 rounded-3xl transition-all text-right group relative overflow-hidden",
                    selectedPatient?.id === patient.id 
                      ? "bg-sky-600 text-white shadow-xl shadow-sky-600/20" 
                      : "glass border-white/5 hover:bg-white/5 text-slate-300"
                  )}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        selectedPatient?.id === patient.id ? "bg-white/20 border-white/30" : "glass bg-white/10 border-white/10"
                      )}>
                         <Users size={20} className={selectedPatient?.id === patient.id ? "text-white" : "text-sky-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold truncate text-sm">{patient.name}</h4>
                         <p className={cn(
                           "text-[10px] mt-1 italic flex items-center gap-1",
                           selectedPatient?.id === patient.id ? "text-sky-100" : "text-slate-500"
                         )}>
                            <Phone size={10} /> {patient.phone}
                         </p>
                      </div>
                   </div>
                   {selectedPatient?.id === patient.id && <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl rounded-full translate-x-10 -translate-y-10" />}
                </button>
              ))}
           </div>
        </div>

        {/* Detail/EMR Section */}
        <div className="lg:col-span-8 space-y-6">
           {selectedPatient ? (
             <motion.div 
               layout
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="h-full flex flex-col"
             >
                <div className="glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden flex-1 flex flex-col">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-[100px] rounded-full translate-x-20 -translate-y-20" />
                   
                   {/* Header Row */}
                   <div className="flex items-start justify-between relative z-10 mb-10">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 glass bg-sky-500/10 rounded-[30px] border border-sky-500/20 flex items-center justify-center text-sky-400">
                            <Users size={40} />
                         </div>
                         <div>
                            <div className="text-[10px] text-sky-400 font-black uppercase tracking-[3px] mb-1 italic">Electronic Medical Record</div>
                            <h3 className="text-3xl font-black text-white">{selectedPatient.name}</h3>
                            <div className="flex items-center gap-4 mt-3">
                               <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 font-bold uppercase tracking-tighter italic">#{selectedPatient.id}</span>
                               <span className="text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-rose-400 font-black italic">{selectedPatient.bloodType || 'N/A'}</span>
                               <span className="text-xs text-slate-500 flex items-center gap-1 font-bold"><Calendar size={14}/> {selectedPatient.age} سنة</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <button className="flex items-center gap-2 px-5 py-2.5 glass bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 transition-all font-bold text-xs"><Edit2 size={16}/> تعديل</button>
                         <button className="p-3 glass bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500/20 transition-all"><Trash2 size={18}/></button>
                      </div>
                   </div>

                   {/* Tabs Row */}
                   <div className="flex items-center gap-6 border-b border-white/5 mb-8 relative z-10">
                      {[
                        { id: 'profile', name: 'الملف الشخصي', icon: FileText },
                        { id: 'emr', name: 'السجل الطبي (EMR)', icon: ActivityIcon },
                        { id: 'history', name: 'تاريخ الزيارات', icon: HistoryIcon }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id as any)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-4 border-b-2 transition-all font-bold text-sm",
                            activeTab === t.id ? "border-sky-500 text-sky-400" : "border-transparent text-slate-500 hover:text-slate-300"
                          )}
                        >
                           <t.icon size={18} />
                           {t.name}
                        </button>
                      ))}
                   </div>

                   {/* Tab Content */}
                   <div className="flex-1 relative z-10">
                      <AnimatePresence mode="wait">
                         {activeTab === 'profile' && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-8">
                              <div className="space-y-6">
                                 <h4 className="text-sm font-black text-indigo-400 tracking-widest uppercase mb-4 italic">معلومات الإتصال والعنوان</h4>
                                 <div className="space-y-4">
                                    <DetailItem icon={Phone} label="رقم الهاتف الأساسي" value={selectedPatient.phone} />
                                    <DetailItem icon={Mail} label="البريد الإلكتروني" value="غير متوفر" />
                                    <DetailItem icon={MapPin} label="عنوان السكن" value={selectedPatient.address || 'اليمن'} />
                                    {selectedPatient.customFields && Object.entries(selectedPatient.customFields).map(([key, value]) => {
                                      const field = dynamicFields.find(f => f.id === key);
                                      if (!field) return null;
                                      return (
                                        <DetailItem 
                                          key={key}
                                          icon={Tag}
                                          label={field.label}
                                          value={typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : String(value)} 
                                        />
                                      );
                                    })}
                                 </div>
                              </div>
                              <div className="space-y-6">
                                 <h4 className="text-sm font-black text-rose-400 tracking-widest uppercase mb-4 italic">الحالة الصحية الحالية</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {selectedPatient.medicalHistory.map((item, i) => (
                                      <span key={i} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl text-xs font-bold italic">{item}</span>
                                    ))}
                                    {selectedPatient.medicalHistory.length === 0 && <span className="text-slate-500 text-xs italic">لا توجد سجلات مرضية سابقة</span>}
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'emr' && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                                    <h5 className="text-white font-bold text-sm flex items-center gap-2 underline decoration-sky-500 underline-offset-8">أحدث التحاليل المخبرية</h5>
                                    <div className="space-y-3 pt-2">
                                       {patientLabs.length > 0 ? patientLabs.map((l, i) => (
                                         <div key={i} className="flex items-center justify-between p-3 glass-card rounded-xl">
                                            <div>
                                               <p className="text-xs font-bold text-white">{l.testType}</p>
                                               <p className="text-[10px] text-slate-500 italic mt-0.5">{l.date}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">مكتمل</span>
                                         </div>
                                       )) : (
                                          <div className="text-center py-6 text-slate-500 text-xs italic">لا توجد تحاليل مسجلة</div>
                                       )}
                                    </div>
                                 </div>
                                 <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                                    <h5 className="text-white font-bold text-sm flex items-center gap-2 underline decoration-indigo-500 underline-offset-8">الأدوية الموصوفة حالياً</h5>
                                    <div className="space-y-3 pt-2">
                                       <div className="p-4 glass-card rounded-2xl border border-indigo-500/10 flex items-center gap-3">
                                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Pill size={16}/></div>
                                          <div className="flex-1">
                                             <p className="text-xs font-bold text-white uppercase italic tracking-tighter">أوجمنتين (Augmentin) 1g</p>
                                             <p className="text-[9px] text-slate-500 mt-1">قرص كل 12 ساعة لمدة 5 أيام</p>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'history' && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                              <h4 className="text-sm font-black text-sky-400 tracking-widest uppercase mb-4 italic">تسلسل زيارات العيادات</h4>
                              <div className="relative pr-8 space-y-8 before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                                 {patientAppointments.length > 0 ? patientAppointments.map((app, i) => (
                                   <div key={i} className="relative group">
                                      <div className="absolute -right-[23px] top-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-[#0f172a] z-10 ring-4 ring-sky-500/10" />
                                      <div className="glass p-5 rounded-[25px] border border-white/5 hover:bg-white/5 transition-all">
                                         <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-mono text-slate-500 italic uppercase tracking-widest">{app.date} | {app.time}</span>
                                            <span className="text-[9px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">{app.status}</span>
                                         </div>
                                         <h6 className="font-bold text-white text-sm">زيارة {app.type === 'consultation' ? 'معاينة' : 'متابعة'}</h6>
                                         <p className="text-[11px] text-slate-400 mt-1 italic">بإشراف الطبيب المناوب في العيادة الخارجية</p>
                                      </div>
                                   </div>
                                 )) : (
                                    <div className="text-center py-20 opacity-30">
                                       <Calendar size={48} className="mx-auto mb-4" />
                                       <p className="text-xs font-black uppercase tracking-[5px]">No History Records</p>
                                    </div>
                                 )}
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
             </motion.div>
           ) : (
             <div className="h-full glass rounded-[40px] flex flex-col items-center justify-center border border-white/5 p-20 text-center opacity-60">
                <Users size={80} className="mb-6 text-slate-700" />
                <h3 className="text-2xl font-black text-slate-600 tracking-[10px] uppercase">Patient Record</h3>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed max-w-xs">يرجى اختيار مريض من القائمة الجانبية لعرض سجله الطبي الإلكتروني (EMR) وإدارة بياناته الصحية بشكل كامل.</p>
             </div>
           )}
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
         {showAddModal && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right my-auto">
                 <div className="flex items-center justify-between mb-10">
                    <button onClick={() => setShowAddModal(false)} className="p-2 glass rounded-full text-slate-500 hover:text-white"><X size={20} /></button>
                    <h3 className="text-2xl font-black text-white border-r-4 border-sky-500 pr-5 tracking-tighter">تسجيل مريض جديد بالنظام</h3>
                 </div>

                 <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase italic">الاسم الرباعي</label>
                       <input name="name" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" placeholder="مثال: أحمد محمد علي صالح" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase italic">رقم الهاتف الشغال</label>
                       <input name="phone" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" placeholder="77XXXXXXX" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase italic">العمر</label>
                       <input name="age" type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase italic">الجنس</label>
                       <select name="gender" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                          <option value="male" className="bg-slate-900">ذكر</option>
                          <option value="female" className="bg-slate-900">أنثى</option>
                       </select>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <h4 className="col-span-2 text-[10px] font-black text-sky-500 uppercase tracking-widest italic mb-2">معلومات إضافية مخصصة</h4>
                      {dynamicFields.filter(f => f.entity === 'patient' && f.isActive).map(field => (
                        <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">{field.label}</label>
                          {field.type === 'text' && (
                            <input 
                              type="text" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" 
                            />
                          )}
                          {field.type === 'number' && (
                            <input 
                              type="number" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" 
                            />
                          )}
                          {field.type === 'date' && (
                            <input 
                              type="date" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" 
                            />
                          )}
                          {field.type === 'select' && (
                            <select
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                            >
                              <option value="" className="bg-slate-900 italic text-slate-500">-- اختر --</option>
                              {field.options?.map((opt, i) => (
                                <option key={i} value={opt} className="bg-slate-900">{opt}</option>
                              ))}
                            </select>
                          )}
                          {field.type === 'boolean' && (
                            <div className="flex items-center gap-3 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                              <input 
                                type="checkbox" 
                                checked={newPatientCustomFields[field.id] || false}
                                onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.checked})}
                                className="w-5 h-5 rounded bg-white/5 border-white/10 text-sky-600 focus:ring-sky-500"
                              />
                              <span className="text-xs font-bold text-slate-400">تفعيل الخيار</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="col-span-2 pt-10 flex gap-4">
                       <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/20 hover:bg-sky-500 transition-all uppercase tracking-widest">إتمام عملية التسجيل</button>
                       <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-widest">إلغاء الأمر</button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}

interface DetailItemProps {
  icon: any;
  label: string;
  value: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-start gap-4 p-4 glass-card rounded-2xl border border-white/5 bg-white/5 group hover:bg-white/10 transition-colors">
       <div className="p-2 glass bg-white/5 text-slate-500 rounded-lg group-hover:text-sky-400 transition-colors">
          <Icon size={18} />
       </div>
       <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter italic">{label}</p>
          <p className="text-white text-sm font-semibold">{value}</p>
       </div>
    </div>
  );
};
