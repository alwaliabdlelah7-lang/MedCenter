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
  Tag,
  Plus,
  Receipt,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Appointment, LabTest, PharmacyItem, DynamicFieldDefinition, ClinicalVisit, Prescription, RadiologyScan, Clinic } from '../types';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { INITIAL_PATIENTS } from '../data/seedData';
import { dataStore } from '../services/dataService';

export default function PatientManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prefilledName, setPrefilledName] = useState('');
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyScans, setRadiologyScans] = useState<RadiologyScan[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [patientsData, fieldsData, apptsData, labsData, scansData, prescriptionsData, visitsData, clinicsData] = await Promise.all([
        dataStore.getAll<Patient>('patients'),
        dataStore.getAll<DynamicFieldDefinition>('dynamic_fields'),
        dataStore.getAll<Appointment>('appointments'),
        dataStore.getAll<LabTest>('lab_tests'),
        dataStore.getAll<RadiologyScan>('radiology_scans'),
        dataStore.getAll<Prescription>('prescriptions'),
        dataStore.getAll<ClinicalVisit>('clinical_visits'),
        dataStore.getAll<Clinic>('clinics')
      ]);
      setPatients(patientsData.length > 0 ? patientsData : INITIAL_PATIENTS);
      setDynamicFields(fieldsData);
      setAppointments(apptsData);
      setLabTests(labsData);
      setRadiologyScans(scansData);
      setPrescriptions(prescriptionsData);
      setVisits(visitsData);
      setClinics(clinicsData);
    } catch (error) {
      console.error("Failed to load patient management data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const addParam = searchParams.get('add');
    const nameParam = searchParams.get('name');
    if (addParam === 'true') {
      setShowAddModal(true);
      if (nameParam) setPrefilledName(decodeURIComponent(nameParam));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'emr' | 'history' | 'billing'>('profile');

  const [newPatientCustomFields, setNewPatientCustomFields] = useState<Record<string, any>>({});
  const [editPatientData, setEditPatientData] = useState<Patient | null>(null);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patientAppointments = selectedPatient ? appointments.filter(a => a.patientId === selectedPatient.id) : [];
  const patientLabs = selectedPatient ? labTests.filter(l => l.patientId === selectedPatient.id) : [];
  const patientScans = selectedPatient ? radiologyScans.filter(s => s.patientId === selectedPatient.id) : [];
  const patientPrescriptions = selectedPatient ? prescriptions.filter(p => p.patientId === selectedPatient.id) : [];
  const patientVisits = selectedPatient ? visits.filter(v => v.patientId === selectedPatient.id) : [];

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
      clinicId: formData.get('clinicId') as string,
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

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPatientData) return;
    
    await dataStore.updateItem('patients', editPatientData.id, editPatientData);
    setPatients(patients.map(p => p.id === editPatientData.id ? editPatientData : p));
    if (selectedPatient?.id === editPatientData.id) setSelectedPatient(editPatientData);
    setShowEditModal(false);
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المريض وجميع سجلاته؟')) return;
    await dataStore.deleteItem('patients', id);
    setPatients(patients.filter(p => p.id !== id));
    if (selectedPatient?.id === id) setSelectedPatient(null);
  };

  const [newVisit, setNewVisit] = useState({
    reason: '',
    vitals: { temp: '', bp: '', hr: '', weight: '' },
    diagnosis: '',
    treatmentPlan: ''
  });

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const visit: ClinicalVisit = {
      id: `VIS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: selectedPatient.id,
      doctorId: 'D-ADMIN',
      date: new Date().toISOString(),
      ...newVisit,
      prescriptions: [],
      labOrders: [],
      radOrders: []
    };

    await dataStore.addItem('clinical_visits', visit);
    setVisits([...visits, visit]);
    setShowVisitModal(false);
    setNewVisit({ reason: '', vitals: { temp: '', bp: '', hr: '', weight: '' }, diagnosis: '', treatmentPlan: '' });
  };

  return (
    <div className="space-y-6 lg:p-4 text-right h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">إدارة المرضى والسجل الطبي الرقمي</h2>
          <p className="text-sm text-sky-400 border-r-4 border-sky-500 pr-3 font-medium mt-1">مركز MedCenter: نظام إدارة البيانات الصحية الموحد</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم، الهاتف، أو المعرف..." 
              className="pr-10 pl-4 py-3 glass bg-white/5 text-white border border-white/10 rounded-2xl focus:border-sky-400 outline-none w-72 transition-all shadow-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-sky-600/20 hover:bg-sky-500 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <UserPlus size={18} />
            <span>تسجيل مريض</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[700px]">
        {/* Patient List Section */}
        <div className="lg:col-span-4 glass rounded-[40px] overflow-hidden flex flex-col border border-white/10 shadow-2xl relative">
           <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="text-white font-black text-sm flex items-center gap-2 uppercase tracking-widest">
                 <Users size={18} className="text-sky-400" /> قائمة المراجعين
              </h3>
              <div className="flex items-center gap-1">
                 <button className="p-2 text-slate-500 hover:text-white glass rounded-xl transition-colors"><Filter size={16} /></button>
                 <button className="p-2 text-slate-500 hover:text-white glass rounded-xl transition-colors"><Download size={16} /></button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {filtered.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={cn(
                    "w-full p-5 rounded-[30px] transition-all text-right group relative overflow-hidden border",
                    selectedPatient?.id === patient.id 
                      ? "bg-sky-600 border-white/20 text-white shadow-2xl shadow-sky-600/30 -translate-x-2" 
                      : "glass border-white/5 hover:bg-white/5 text-slate-400"
                  )}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
                        selectedPatient?.id === patient.id ? "bg-white/20 border-white/30" : "glass bg-white/5 border-white/10"
                      )}>
                         <Users size={22} className={selectedPatient?.id === patient.id ? "text-white" : "text-sky-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-black truncate text-sm uppercase tracking-tight">{patient.name}</h4>
                         <p className={cn(
                           "text-[10px] mt-1 italic flex items-center gap-1 font-mono",
                           selectedPatient?.id === patient.id ? "text-sky-100" : "text-slate-500"
                         )}>
                            <Phone size={10} /> {patient.phone}
                         </p>
                      </div>
                   </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <Search size={40} className="mx-auto mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">لا توجد نتائج</p>
                </div>
              )}
           </div>
        </div>

        {/* Detail/EMR Section */}
        <div className="lg:col-span-8 flex flex-col h-full">
           {selectedPatient ? (
             <motion.div 
               layout
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="h-full flex flex-col space-y-6"
             >
                <div className="glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden flex-1 flex flex-col shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full translate-x-20 -translate-y-20" />
                   
                   {/* Header Row */}
                   <div className="flex items-start justify-between relative z-10 mb-10">
                      <div className="flex items-center gap-8">
                         <div className="w-24 h-24 glass bg-sky-500/10 rounded-[35px] border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-2xl">
                            <Users size={48} />
                         </div>
                         <div>
                            <div className="text-[10px] text-sky-400 font-black uppercase tracking-[4px] mb-2 italic">Patient Identity File</div>
                            <h3 className="text-4xl font-black text-white tracking-tighter">{selectedPatient.name}</h3>
                            <div className="flex items-center gap-4 mt-4">
                               <span className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-400 font-black uppercase tracking-widest italic">ID: {selectedPatient.id}</span>
                               <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-rose-400 font-black italic">B-TYPE: {selectedPatient.bloodType || 'N/A'}</span>
                               <span className="text-[10px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-widest italic"><Calendar size={14} className="text-sky-500"/> {selectedPatient.age} YEARS OLD</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setShowVisitModal(true)}
                           className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-black text-xs shadow-xl shadow-emerald-600/20 uppercase tracking-widest"
                         >
                            <Plus size={18}/> زيارة طبية
                         </button>
                         <button 
                           onClick={() => {
                             setEditPatientData(selectedPatient);
                             setShowEditModal(true);
                           }}
                           className="p-3 glass bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 transition-all"
                         >
                            <Edit2 size={20}/>
                         </button>
                         <button 
                           onClick={() => handleDeletePatient(selectedPatient.id)}
                           className="p-3 glass bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500/20 transition-all"
                         >
                            <Trash2 size={20}/>
                         </button>
                      </div>
                   </div>

                   {/* Tabs Row Navigation */}
                   <div className="flex items-center gap-2 border-b border-white/5 mb-8 relative z-10 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'profile', name: 'البيانات الأساسية', icon: UserPlus },
                        { id: 'emr', name: 'السجل الطبي الرقمي', icon: ActivityIcon },
                        { id: 'history', name: 'الأرشيف الزمني', icon: HistoryIcon },
                        { id: 'billing', name: 'كشف الحساب', icon: Receipt }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id as any)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-black text-xs uppercase tracking-tight whitespace-nowrap",
                            activeTab === t.id 
                              ? "border-sky-500 text-sky-400 bg-sky-500/5" 
                              : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          )}
                        >
                           <t.icon size={16} />
                           {t.name}
                        </button>
                      ))}
                   </div>

                   {/* Main Tab Viewport */}
                   <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-2">
                      <AnimatePresence mode="wait">
                         {activeTab === 'profile' && (
                           <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-8 text-right">
                                 <h4 className="text-xs font-black text-sky-500 tracking-[3px] uppercase mb-4 italic">Contact & Residence Information</h4>
                                 <div className="grid grid-cols-1 gap-4">
                                    <DetailItem icon={Phone} label="رقم الجوال النشط" value={selectedPatient.phone} />
                                    <DetailItem icon={MapPin} label="موقع السكن الحالي" value={selectedPatient.address || 'غير محدد في النظام'} />
                                    <DetailItem icon={Calendar} label="تاريخ فتح الملف" value={new Date(selectedPatient.createdAt).toLocaleDateString('ar-YE')} />
                                    <DetailItem icon={ActivityIcon} label="العيادة المختارة" value={clinics.find(c => c.id === selectedPatient.clinicId)?.name || 'غير محدد'} />
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
                              <div className="space-y-8 text-right">
                                 <h4 className="text-xs font-black text-rose-500 tracking-[3px] uppercase mb-4 italic">Chronic Conditions & History</h4>
                                 <div className="p-8 glass bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                                     <div className="flex flex-wrap gap-3">
                                       {selectedPatient.medicalHistory.map((item, i) => (
                                         <span key={i} className="px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase italic shadow-lg">{item}</span>
                                       ))}
                                       {selectedPatient.medicalHistory.length === 0 && <div className="text-slate-700 font-black uppercase tracking-widest text-[10px] italic">No documented history</div>}
                                     </div>
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'emr' && (
                           <motion.div key="emr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {/* Lab Section */}
                                 <div className="glass p-6 rounded-[35px] border border-white/5 space-y-6 text-right shadow-xl">
                                    <h5 className="text-white font-black text-xs flex items-center gap-2 uppercase tracking-widest italic decoration-sky-500 underline underline-offset-8">Laboratory Analysis</h5>
                                    <div className="space-y-3 pt-2">
                                       {patientLabs.map((l, i) => (
                                         <div key={i} className="flex flex-col gap-2 p-4 glass rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                            <div className="flex items-center justify-between">
                                               <p className="text-xs font-black text-white group-hover:text-sky-400 transition-colors uppercase">{l.testType}</p>
                                               <span className={cn(
                                                 "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                                 l.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                               )}>{l.status === 'completed' ? 'READY' : 'PENDING'}</span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 italic mt-0.5 font-mono">{l.date}</p>
                                            {l.result && <div className="mt-2 p-3 bg-black/20 rounded-xl text-[10px] text-sky-300 italic border-r-2 border-sky-500">{l.result}</div>}
                                         </div>
                                       ))}
                                       {patientLabs.length === 0 && <div className="text-center py-10 text-slate-800 font-bold uppercase tracking-widest text-[9px]">Empty Archives</div>}
                                    </div>
                                 </div>

                                 {/* Pharmacy Section */}
                                 <div className="glass p-6 rounded-[35px] border border-white/5 space-y-6 text-right shadow-xl">
                                    <h5 className="text-white font-black text-xs flex items-center gap-2 uppercase tracking-widest italic decoration-emerald-500 underline underline-offset-8">Pharmacotherapy</h5>
                                    <div className="space-y-3 pt-2">
                                       {patientPrescriptions.map((pr, i) => (
                                         <div key={i} className="flex flex-col gap-2 p-4 glass rounded-2xl border border-white/5 group">
                                            <div className="p-2 w-fit bg-emerald-500/10 text-emerald-400 rounded-lg"><Pill size={16}/></div>
                                            <p className="text-xs font-black text-white uppercase">{pr.items.map(mi => mi.tradeName).join(' + ')}</p>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                               <p className="text-[9px] text-slate-500 italic font-mono">{pr.date}</p>
                                               <span className="text-[8px] font-black bg-white/5 px-2 py-0.5 rounded text-slate-400 uppercase">{pr.status}</span>
                                            </div>
                                         </div>
                                       ))}
                                       {patientPrescriptions.length === 0 && <div className="text-center py-10 text-slate-800 font-bold uppercase tracking-widest text-[9px]">No Active Scripts</div>}
                                    </div>
                                 </div>

                                 {/* Radiology Section */}
                                 <div className="glass p-6 rounded-[35px] border border-white/5 space-y-6 text-right shadow-xl">
                                    <h5 className="text-white font-black text-xs flex items-center gap-2 uppercase tracking-widest italic decoration-indigo-500 underline underline-offset-8">Imaging Diagnostics</h5>
                                    <div className="space-y-3 pt-2">
                                       {patientScans.map((s, i) => (
                                         <div key={i} className="flex flex-col gap-2 p-4 glass rounded-2xl border border-white/5 group">
                                            <div className="p-2 w-fit bg-indigo-500/10 text-indigo-400 rounded-lg"><ActivityIcon size={16}/></div>
                                            <p className="text-xs font-black text-white uppercase">{s.scanType}</p>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                               <p className="text-[9px] text-slate-500 italic font-mono">{s.date}</p>
                                               <span className="text-[8px] font-black text-indigo-400 uppercase">{s.status === 'completed' ? 'REPORTED' : 'WAITING'}</span>
                                            </div>
                                         </div>
                                       ))}
                                       {patientScans.length === 0 && <div className="text-center py-10 text-slate-800 font-bold uppercase tracking-widest text-[9px]">No Media Files</div>}
                                    </div>
                                 </div>
                              </div>

                              {/* Clinical Visits Timeline */}
                              <div className="space-y-6 pt-6 text-right">
                                 <h5 className="text-sky-500 font-black text-xs uppercase tracking-[5px] italic border-r-4 border-sky-500 pr-4">Clinical Encounter Timeline</h5>
                                 <div className="space-y-6">
                                    {patientVisits.length > 0 ? [...patientVisits].reverse().map(v => (
                                      <div key={v.id} className="glass p-8 rounded-[40px] border border-white/5 relative group hover:bg-white/5 transition-all shadow-2xl">
                                         <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">
                                            <div className="flex items-center gap-4">
                                               <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 shadow-xl">
                                                  <Calendar size={18} />
                                               </div>
                                               <span className="text-xs font-black text-white italic">{new Date(v.date).toLocaleString('ar-YE', { dateStyle: 'full', timeStyle: 'short' })}</span>
                                            </div>
                                            <div className="flex gap-2">
                                               <span className="text-[9px] font-black bg-rose-500/10 px-3 py-1.5 rounded-xl text-rose-400 border border-rose-500/20 uppercase">TEMP: {v.vitals.temp}°C</span>
                                               <span className="text-[9px] font-black bg-sky-500/10 px-3 py-1.5 rounded-xl text-sky-400 border border-sky-500/20 uppercase">BP: {v.vitals.bp}</span>
                                               <span className="text-[9px] font-black bg-emerald-500/10 px-3 py-1.5 rounded-xl text-emerald-400 border border-emerald-500/20 uppercase">HR: {v.vitals.hr} BPM</span>
                                            </div>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div>
                                               <p className="text-[9px] text-slate-500 font-black uppercase mb-2 tracking-[2px] italic">Presenting Complaint</p>
                                               <p className="text-sm text-white font-medium bg-white/5 p-4 rounded-2xl border border-white/5 leading-relaxed">{v.reason}</p>
                                            </div>
                                            <div>
                                               <p className="text-[9px] text-rose-500 font-black uppercase mb-2 tracking-[2px] italic">Confirmed Diagnosis</p>
                                               <p className="text-sm text-rose-400 font-black bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 leading-relaxed">{v.diagnosis}</p>
                                            </div>
                                         </div>
                                         <div className="mt-8 pt-8 border-t border-white/5">
                                            <p className="text-[9px] text-emerald-500 font-black uppercase mb-4 tracking-[2px] italic">Management Plan & Instructions</p>
                                            <div className="text-sm text-slate-300 italic leading-[1.8] bg-white/5 p-6 rounded-3xl border border-white/5 border-l-4 border-l-emerald-500">
                                               {v.treatmentPlan}
                                            </div>
                                         </div>
                                      </div>
                                    )) : (
                                      <div className="text-center py-32 opacity-10 border-4 border-dashed border-white/10 rounded-[50px]">
                                         <ActivityIcon size={80} className="mx-auto mb-6 text-slate-500" />
                                         <p className="text-xl font-black uppercase tracking-[15px]">NO ENCOUNTERS</p>
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'history' && (
                           <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-right">
                              <h4 className="text-xs font-black text-sky-400 tracking-[5px] uppercase mb-8 italic">Appointment History Ledger</h4>
                              <div className="relative pr-10 space-y-8 before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-sky-500/50 before:to-transparent">
                                 {patientAppointments.map((app, i) => (
                                   <div key={i} className="relative group">
                                      <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0f172a] border-4 border-sky-500 z-10 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-transform group-hover:scale-125" />
                                      <div className="glass p-6 rounded-[35px] border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between shadow-xl">
                                         <div className="text-right">
                                            <div className="flex items-center gap-4 mb-2">
                                               <span className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest bg-white/5 px-3 py-1 rounded-xl font-mono">{app.date} | {app.time}</span>
                                               <span className={cn(
                                                 "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                                 app.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                               )}>{app.status === 'completed' ? 'ARCHIVED' : 'CONFIRMED'}</span>
                                            </div>
                                            <h6 className="font-black text-white text-sm uppercase">Visit Type: {app.type === 'consultation' ? 'CONSULTATION' : 'FOLLOW-UP'}</h6>
                                         </div>
                                         <div className="p-4 bg-white/5 rounded-2xl">
                                            <HistoryIcon size={24} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                                 {patientAppointments.length === 0 && <div className="text-center py-32 text-slate-800 font-black uppercase tracking-[10px] text-xs underline decoration-sky-500 decoration-wavy underline-offset-[20px]">Empty Chronicles</div>}
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'billing' && (
                           <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 text-right">
                              <div className="flex items-center justify-between mb-2">
                                 <h4 className="text-xs font-black text-emerald-500 tracking-[5px] uppercase italic">Financial Account Ledger</h4>
                                 <button className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-2xl hover:bg-emerald-500/20 transition-all uppercase italic shadow-lg shadow-emerald-500/10">
                                    <Receipt size={14}/> EXPORT ACCOUNT STATEMENT
                                 </button>
                              </div>
                              <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
                                 <table className="w-full text-right text-sm">
                                    <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[3px]">
                                       <tr>
                                          <th className="p-6 border-b border-white/5">DATE</th>
                                          <th className="p-6 border-b border-white/5">SERVICE DESCRIPTION</th>
                                          <th className="p-6 border-b border-white/5">AMOUNT</th>
                                          <th className="p-6 border-b border-white/5">CLEARANCE</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                       <tr className="hover:bg-white/5 transition-colors group">
                                          <td className="p-6 text-slate-400 font-mono italic text-xs tracking-widest">2026-04-23</td>
                                          <td className="p-6 font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic text-xs">Medical Consultation - Internal Medicine</td>
                                          <td className="p-6 text-emerald-400 font-black font-mono">5,000 YER</td>
                                          <td className="p-6"><span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">CLEARED</span></td>
                                       </tr>
                                       {patientLabs.map((l, i) => (
                                         <tr key={i} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6 text-slate-400 font-mono italic text-xs tracking-widest">{l.date}</td>
                                            <td className="p-6 font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic text-xs">Lab Test: {l.testType}</td>
                                            <td className="p-6 text-emerald-400 font-black font-mono">3,500 YER</td>
                                            <td className="p-6"><span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">CLEARED</span></td>
                                         </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                              <div className="p-8 glass bg-emerald-500/5 rounded-[45px] border border-emerald-500/10 flex items-center justify-between shadow-emerald-500/5 shadow-2xl relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <div className="text-right relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mb-2 font-mono">Total Cumulative Clearance</p>
                                    <h5 className="text-4xl font-black text-white italic tracking-tighter">{(5000 + (patientLabs.length * 3500)).toLocaleString()} <small className="text-sm text-slate-500 not-italic font-mono uppercase">YER</small></h5>
                                 </div>
                                 <div className="p-6 bg-emerald-500/10 rounded-[30px] text-emerald-400 shadow-2xl relative z-10">
                                    <TrendingUp size={48} className="group-hover:translate-x-2 transition-transform" />
                                 </div>
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
             </motion.div>
           ) : (
             <div className="h-full glass rounded-[50px] flex flex-col items-center justify-center border border-white/5 p-24 text-center opacity-40 shadow-inner group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent animate-pulse" />
                <Users size={120} className="mb-10 text-slate-800 group-hover:scale-110 transition-transform duration-700" />
                <h3 className="text-4xl font-black text-slate-700 tracking-[15px] uppercase">Select Record</h3>
                <p className="text-sm text-slate-600 mt-6 leading-[2] max-w-sm font-black uppercase tracking-widest">
                   Access unified healthcare records, clinical insights and unified financial statements.
                </p>
             </div>
           )}
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
         {showAddModal && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center justify-between mb-12">
                    <button onClick={() => setShowAddModal(false)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
                    <h3 className="text-3xl font-black text-white border-r-8 border-sky-500 pr-6 tracking-tighter uppercase">New Patient Enrollment</h3>
                 </div>

                 <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Full Legal Name</label>
                       <input name="name" key={prefilledName} defaultValue={prefilledName} required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all" placeholder="Enter patient name..." />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Mobile Number</label>
                       <input name="phone" required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono transition-all" placeholder="+967XXXXXXXXX" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Patient Age</label>
                       <input name="age" type="number" required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono transition-all" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Biological Gender</label>
                       <select name="gender" className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black uppercase tracking-widest text-xs">
                          <option value="male" className="bg-slate-900">MALE / ذكر</option>
                          <option value="female" className="bg-slate-900">FEMALE / أنثى</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Assigned Clinic</label>
                       <select name="clinicId" className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black uppercase tracking-widest text-xs">
                          <option value="" className="bg-slate-900">-- SELECT CLINIC --</option>
                          {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id} className="bg-slate-900">{clinic.name}</option>
                          ))}
                       </select>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                      <h4 className="col-span-2 text-[10px] font-black text-sky-500 uppercase tracking-[5px] italic mb-2">Dynamic Extended Attributes</h4>
                      {dynamicFields.filter(f => f.entity === 'patient' && f.isActive).map(field => (
                        <div key={field.id} className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{field.label}</label>
                          {field.type === 'text' && (
                            <input 
                              type="text" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" 
                            />
                          )}
                          {field.type === 'number' && (
                            <input 
                              type="number" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" 
                            />
                          )}
                          {field.type === 'date' && (
                            <input 
                              type="date" 
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" 
                            />
                          )}
                          {field.type === 'select' && (
                            <select
                              required={field.required}
                              onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.value})}
                              className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-black text-xs"
                            >
                              <option value="" className="bg-slate-900 italic text-slate-800">-- SELECT --</option>
                              {field.options?.map((opt, i) => (
                                <option key={i} value={opt} className="bg-slate-900">{opt}</option>
                              ))}
                            </select>
                          )}
                          {field.type === 'boolean' && (
                            <div className="flex items-center gap-4 p-5 glass bg-white/5 rounded-2xl border border-white/5">
                              <input 
                                type="checkbox" 
                                checked={newPatientCustomFields[field.id] || false}
                                onChange={(e) => setNewPatientCustomFields({...newPatientCustomFields, [field.id]: e.target.checked})}
                                className="w-6 h-6 rounded-lg bg-white/5 border-white/10 text-sky-600 focus:ring-sky-500"
                              />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enable Toggle</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="col-span-2 pt-12 flex gap-6">
                       <button type="submit" className="flex-1 py-6 bg-sky-600 text-white rounded-[30px] font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-[4px] text-xs">Authorize Enrollment</button>
                       <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-6 glass bg-white/5 text-slate-500 rounded-[30px] font-black hover:bg-white/10 transition-all uppercase tracking-[4px] text-xs">Terminate</button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
         
         {showVisitModal && selectedPatient && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVisitModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-2xl">
                 <h3 className="text-2xl font-black mb-10 text-white border-r-8 border-emerald-500 pr-6 uppercase tracking-tighter">Clinical Encounter Log</h3>
                 <form onSubmit={handleAddVisit} className="space-y-6">
                    <div className="space-y-3 text-right">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Primary Complaint & Symptoms</label>
                       <textarea 
                          required 
                          value={newVisit.reason}
                          onChange={(e) => setNewVisit({...newVisit, reason: e.target.value})}
                          className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 min-h-[120px] leading-relaxed" 
                          placeholder="Document patient presenting symptoms..."
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Temperature (Celsius)</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-mono text-center" 
                            value={newVisit.vitals.temp}
                            onChange={(e) => setNewVisit({...newVisit, vitals: {...newVisit.vitals, temp: e.target.value}})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Blood Pressure (mmHg)</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-mono text-center" 
                            value={newVisit.vitals.bp}
                            onChange={(e) => setNewVisit({...newVisit, vitals: {...newVisit.vitals, bp: e.target.value}})}
                          />
                       </div>
                    </div>
                    <div className="space-y-3 text-right">
                       <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Clinical Impression / Diagnosis</label>
                       <input 
                          required 
                          value={newVisit.diagnosis}
                          onChange={(e) => setNewVisit({...newVisit, diagnosis: e.target.value})}
                          className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-rose-400 font-black outline-none focus:border-rose-500 transition-all shadow-rose-500/5 shadow-inner" 
                       />
                    </div>
                    <div className="space-y-3 text-right">
                       <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Long-term Management Pathway</label>
                       <textarea 
                          required 
                          value={newVisit.treatmentPlan}
                          onChange={(e) => setNewVisit({...newVisit, treatmentPlan: e.target.value})}
                          className="w-full px-6 py-6 glass bg-white/5 border border-white/10 rounded-3xl text-white outline-none focus:border-indigo-500 min-h-[140px] leading-relaxed italic" 
                       />
                    </div>
                    <div className="flex gap-6 pt-6">
                       <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 transition-all uppercase tracking-widest text-xs">Commit to EMR</button>
                       <button type="button" onClick={() => setShowVisitModal(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Abort Operation</button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}

         {showEditModal && editPatientData && (
           <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 overflow-y-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-2xl">
                 <h3 className="text-2xl font-black mb-10 text-sky-400 border-l-8 border-sky-500 pl-6 uppercase tracking-tighter">Modify Identity Attributes</h3>
                 <form onSubmit={handleUpdatePatient} className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Primary Legal Alias</label>
                       <input 
                         className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white font-bold" 
                         value={editPatientData.name} 
                         onChange={(e) => setEditPatientData({...editPatientData, name: e.target.value})} 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Communication Number</label>
                          <input 
                            className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white font-mono" 
                            value={editPatientData.phone} 
                            onChange={(e) => setEditPatientData({...editPatientData, phone: e.target.value})} 
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Age Value</label>
                          <input 
                            type="number" 
                            className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white font-mono" 
                            value={editPatientData.age} 
                            onChange={(e) => setEditPatientData({...editPatientData, age: parseInt(e.target.value)})} 
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Clinic</label>
                          <select 
                            className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black uppercase tracking-widest text-xs"
                            value={editPatientData.clinicId || ''}
                            onChange={(e) => setEditPatientData({...editPatientData, clinicId: e.target.value})}
                          >
                            <option value="" className="bg-slate-900">-- SELECT CLINIC --</option>
                            {clinics.map(clinic => (
                              <option key={clinic.id} value={clinic.id} className="bg-slate-900">{clinic.name}</option>
                            ))}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-3 text-right">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Residence Address Header</label>
                       <input 
                         className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white" 
                         value={editPatientData.address || ''} 
                         onChange={(e) => setEditPatientData({...editPatientData, address: e.target.value})} 
                       />
                    </div>
                    <div className="flex gap-6 pt-8">
                       <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-[30px] font-black hover:bg-sky-500 transition-all uppercase tracking-widest text-xs shadow-xl shadow-sky-600/30">Apply Structural Change</button>
                       <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-[30px] font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Cancel Process</button>
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
    <div className="flex items-start gap-5 p-6 glass rounded-[30px] border border-white/5 bg-white/5 group hover:bg-white/10 transition-all shadow-xl hover:shadow-sky-500/5">
       <div className="p-3 glass bg-sky-500/10 text-sky-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all shadow-inner">
          <Icon size={20} />
       </div>
       <div className="text-right">
          <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest italic">{label}</p>
          <p className="text-white text-sm font-black uppercase tracking-tight">{value}</p>
       </div>
    </div>
  );
};
