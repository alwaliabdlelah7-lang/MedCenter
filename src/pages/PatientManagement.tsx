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
  Shield,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Appointment, LabTest, PharmacyItem, DynamicFieldDefinition, ClinicalVisit, Prescription, RadiologyScan, Clinic, MasterLabItem, Service } from '../types';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { INITIAL_PATIENTS, YEMEN_LAB_TESTS, YEMEN_SERVICES } from '../data/seedData';
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
  const [masterLabTests, setMasterLabTests] = useState<MasterLabItem[]>([]);
  const [masterServices, setMasterServices] = useState<Service[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]); // To track ordered services
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [patientsData, fieldsData, apptsData, labsData, scansData, prescriptionsData, visitsData, clinicsData, masterLabsData, masterServicesData, servicesOrdersData] = await Promise.all([
        dataStore.getAll<Patient>('patients'),
        dataStore.getAll<DynamicFieldDefinition>('dynamic_fields'),
        dataStore.getAll<Appointment>('appointments'),
        dataStore.getAll<LabTest>('lab_tests'),
        dataStore.getAll<RadiologyScan>('radiology_scans'),
        dataStore.getAll<Prescription>('prescriptions'),
        dataStore.getAll<ClinicalVisit>('clinical_visits'),
        dataStore.getAll<Clinic>('clinics'),
        dataStore.getAll<MasterLabItem>('master_lab_tests'),
        dataStore.getAll<Service>('services'),
        dataStore.getAll<any>('service_orders')
      ]);
      setPatients(patientsData.length > 0 ? patientsData : INITIAL_PATIENTS);
      setDynamicFields(fieldsData);
      setAppointments(apptsData);
      setLabTests(labsData);
      setRadiologyScans(scansData);
      setPrescriptions(prescriptionsData);
      setVisits(visitsData);
      setClinics(clinicsData);
      setServiceOrders(servicesOrdersData);
      
      if (masterLabsData.length === 0) {
        // Use seed data if DB is empty
        const seeded = YEMEN_LAB_TESTS.map((t, i) => ({
          id: `LBT-${i + 1}`,
          name: t.name,
          price: t.price,
          category: t.category || 'عام',
          isProfile: t.isProfile || false,
          parameters: t.parameters || []
        }));
        setMasterLabTests(seeded);
      } else {
        setMasterLabTests(masterLabsData);
      }

      if (masterServicesData.length === 0) {
        const seeded = (YEMEN_SERVICES as any[]).map((s, i) => ({
          id: `SRV-M-${i + 1}`,
          name: s.name,
          price: s.price,
          category: 'Medical Services',
          departmentId: 'dept-1',
          revenueAccountId: 'acc-1'
        }));
        setMasterServices(seeded);
      } else {
        setMasterServices(masterServicesData);
      }
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
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showServiceOrderModal, setShowServiceOrderModal] = useState(false);
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
  const patientServiceOrders = selectedPatient ? serviceOrders.filter(so => so.patientId === selectedPatient.id) : [];

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

  const [selectedOrderTests, setSelectedOrderTests] = useState<MasterLabItem[]>([]);
  const handleOrderLabs = async () => {
    if (!selectedPatient || selectedOrderTests.length === 0) return;

    const newOrders = selectedOrderTests.map(test => ({
      id: `LAB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: selectedPatient.id,
      testType: test.name,
      testId: test.id,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      price: test.price,
      parameters: test.parameters.map(p => ({ ...p, value: '' }))
    }));

    for (const order of newOrders) {
      await dataStore.addItem('lab_tests', order);
    }
    
    setLabTests([...labTests, ...newOrders]);
    setShowLabOrderModal(false);
    setSelectedOrderTests([]);
  };

  const [selectedOrderService, setSelectedOrderService] = useState<Service | null>(null);
  const [selectedLabEdit, setSelectedLabEdit] = useState<any | null>(null);
  const [selectedLabView, setSelectedLabView] = useState<any | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const handleOrderService = async () => {
    if (!selectedPatient || !selectedOrderService) return;

    const order = {
      id: `SO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      serviceId: selectedOrderService.id,
      serviceName: selectedOrderService.name,
      price: selectedOrderService.price,
      category: (selectedOrderService as any).category || 'Medical Service',
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    await dataStore.addItem('service_orders', order);
    setServiceOrders([...serviceOrders, order]);
    setShowServiceOrderModal(false);
    setSelectedOrderService(null);
  };

  const handleUpdateLabResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabEdit) return;

    const updatedLab = {
      ...selectedLabEdit,
      status: selectedLabEdit.parameters.some((p: any) => p.value !== '') ? 'completed' : 'pending'
    };

    await dataStore.updateItem('lab_tests', updatedLab.id, updatedLab);
    setLabTests(labTests.map(l => l.id === updatedLab.id ? (updatedLab as any) : l));
    setSelectedLabEdit(null);
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفحص؟')) return;
    await dataStore.deleteItem('lab_tests', id);
    setLabTests(labTests.filter(l => l.id !== id));
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
                            <div className="text-[10px] text-sky-400 font-black uppercase tracking-[4px] mb-2 italic">ملف هوية المريض</div>
                            <h3 className="text-4xl font-black text-white tracking-tighter">{selectedPatient.name}</h3>
                            <div className="flex items-center gap-4 mt-4">
                               <span className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-400 font-black uppercase tracking-widest italic">المعرف: {selectedPatient.id}</span>
                               <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-rose-400 font-black italic">فصيلة الدم: {selectedPatient.bloodType || 'غير معروف'}</span>
                               <span className="text-[10px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-widest italic"><Calendar size={14} className="text-sky-500"/> العمر: {selectedPatient.age} سنة</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
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
                          
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setShowLabOrderModal(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                             >
                                <FlaskConical size={14} /> طلب فحوصات
                             </button>
                             <button 
                                onClick={() => setShowServiceOrderModal(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600/20 text-sky-400 border border-sky-500/20 rounded-xl hover:bg-sky-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                             >
                                <Receipt size={14} /> طلب خدمة
                             </button>
                          </div>
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
                                 <h4 className="text-xs font-black text-sky-500 tracking-[3px] uppercase mb-4 italic">بيانات الاتصال والسكن</h4>
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
                                 <h4 className="text-xs font-black text-rose-500 tracking-[3px] uppercase mb-4 italic">الحالات المزمنة والتاريخ المرضي</h4>
                                 <div className="p-8 glass bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                                     <div className="flex flex-wrap gap-3">
                                       {selectedPatient.medicalHistory.map((item, i) => (
                                         <span key={i} className="px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase italic shadow-lg">{item}</span>
                                       ))}
                                       {selectedPatient.medicalHistory.length === 0 && <div className="text-slate-700 font-black uppercase tracking-widest text-[10px] italic">لا يوجد تاريخ مسجل</div>}
                                     </div>
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {activeTab === 'emr' && (
                           <motion.div key="emr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                               {/* Filter Section */}
                               <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
                                  {[
                                     { id: 'all', label: 'الكل', icon: LayoutGrid },
                                     { id: 'visit', label: 'زيارات', icon: ActivityIcon },
                                     { id: 'lab', label: 'مختبر', icon: FlaskConical },
                                     { id: 'prescription', label: 'أدوية', icon: Pill },
                                     { id: 'scan', label: 'أشعة', icon: ActivityIcon }
                                  ].map((f) => (
                                     <button
                                       key={f.id}
                                       onClick={() => setTimelineFilter(f.id)}
                                       className={cn(
                                          "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all glass border",
                                          timelineFilter === f.id ? "bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-lg shadow-sky-500/10" : "text-slate-500 border-white/5 hover:bg-white/5"
                                       )}
                                     >
                                        <f.icon size={14} />
                                        {f.label}
                                     </button>
                                  ))}
                               </div>
                               {/* Quick Summary Cards */}
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="p-6 glass bg-sky-500/5 rounded-3xl border border-sky-500/10 text-right">
                                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">آخر ضغط دم</p>
                                     <h6 className="text-xl font-black text-white">{patientVisits[patientVisits.length - 1]?.vitals.bp || '--/--'}</h6>
                                  </div>
                                  <div className="p-6 glass bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-right">
                                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">الأدوية النشطة</p>
                                     <h6 className="text-xl font-black text-white">{patientPrescriptions.length}</h6>
                                  </div>
                                  <div className="p-6 glass bg-amber-500/5 rounded-3xl border border-amber-500/10 text-right">
                                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">فحوصات معلقة</p>
                                     <h6 className="text-xl font-black text-white">{patientLabs.filter(l => l.status === 'pending').length}</h6>
                                  </div>
                                  <div className="p-6 glass bg-rose-500/5 rounded-3xl border border-rose-500/10 text-right">
                                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">آخر نبض</p>
                                     <h6 className="text-xl font-black text-white">{patientVisits[patientVisits.length - 1]?.vitals.hr || '--'} BPM</h6>
                                  </div>
                               </div>

                               <div className="space-y-8 pr-8 relative before:absolute before:right-0 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-sky-500/20 before:via-emerald-500/20 before:to-transparent">
                                  {[
                                     ...patientVisits.map(v => ({ ...v, type: 'visit' as const })),
                                     ...patientLabs.map(l => ({ ...l, type: 'lab' as const })),
                                     ...patientPrescriptions.map(p => ({ ...p, type: 'prescription' as const })),
                                     ...patientScans.map(s => ({ ...s, type: 'scan' as const }))
                                  ]
                                  .filter(item => timelineFilter === 'all' || item.type === timelineFilter)
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
                                     <div key={idx} className="relative group">
                                        <div className={cn(
                                           "absolute -right-[36.5px] top-6 w-3 h-3 rounded-full border-2 border-[#0f172a] z-10 transition-transform group-hover:scale-125 shadow-xl",
                                           item.type === 'visit' ? "bg-sky-500 shadow-sky-500/50" : 
                                           item.type === 'lab' ? "bg-amber-500 shadow-amber-500/50" :
                                           item.type === 'prescription' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-indigo-500 shadow-indigo-500/50"
                                        )} />

                                        <div 
                                          onClick={() => {
                                             if (item.type === 'lab') {
                                                if (item.status === 'completed') setSelectedLabView(item);
                                                else setSelectedLabEdit(item);
                                             }
                                          }}
                                          className={cn(
                                             "glass p-8 rounded-[40px] border border-white/5 hover:bg-white/5 transition-all text-right shadow-2xl cursor-pointer group active:scale-[0.98]",
                                             item.type === 'visit' ? "hover:border-sky-500/30" : 
                                             item.type === 'lab' ? "hover:border-amber-500/30" : "hover:border-emerald-500/30"
                                          )}
                                        >
                                           <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                              <div className="flex items-center gap-4">
                                                 <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-inner",
                                                    item.type === 'visit' ? "bg-sky-600/80" : 
                                                    item.type === 'lab' ? "bg-amber-600/80" :
                                                    item.type === 'prescription' ? "bg-emerald-600/80" : "bg-indigo-600/80"
                                                 )}>
                                                    {item.type === 'visit' ? <ActivityIcon size={20}/> : 
                                                     item.type === 'lab' ? <FlaskConical size={20}/> :
                                                     item.type === 'prescription' ? <Pill size={20}/> : <ActivityIcon size={20} />}
                                                  </div>
                                                  <div>
                                                     <p className="text-xs font-black text-white uppercase tracking-tight">
                                                        {item.type === 'visit' ? 'زيارة طبية' : 
                                                         item.type === 'lab' ? `فحص: ${item.testType}` :
                                                         item.type === 'prescription' ? 'وصفة علاجية' : 'تصوير إشعاعي'}
                                                     </p>
                                                     <p className="text-[10px] text-slate-500 font-mono mt-1">
                                                        {new Date(item.date).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                     </p>
                                                  </div>
                                               </div>
                                               <span className={cn(
                                                  "text-[8px] font-black px-3 py-1.5 rounded-xl uppercase border tracking-widest",
                                                  (item as any).status === 'completed' || (item as any).status === 'active' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                                               )}>{(item as any).status || 'RECORDED'}</span>
                                            </div>

                                            {item.type === 'visit' && (
                                              <div className="space-y-6">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">الأعراض والشكوى</p>
                                                       <p className="text-sm text-white italic bg-white/5 p-4 rounded-2xl border border-white/5">{item.reason}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                       <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-1 italic">التشخيص النهائي</p>
                                                       <p className="text-sm text-rose-400 font-black bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">{item.diagnosis}</p>
                                                    </div>
                                                 </div>
                                                 <div className="p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 flex gap-6">
                                                    <div className="text-center border-l border-sky-500/20 pl-6">
                                                       <p className="text-[8px] text-slate-500 uppercase">BP</p>
                                                       <p className="text-xs font-black text-sky-400">{item.vitals.bp}</p>
                                                    </div>
                                                    <div className="text-center">
                                                       <p className="text-[8px] text-slate-500 uppercase">TEMP</p>
                                                       <p className="text-xs font-black text-sky-400">{item.vitals.temp}°C</p>
                                                    </div>
                                                 </div>
                                              </div>
                                            )}

                                            {item.type === 'lab' && (
                                              <div className="space-y-4">
                                                 <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest italic mb-2">ملخص النتائج المخبرية</p>
                                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {(item as any).parameters?.map((p: any) => (
                                                       <div key={p.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                                          <p className="text-[8px] text-slate-500 uppercase truncate mb-1">{p.name}</p>
                                                          <p className="text-xs text-white font-black">{p.value || 'بانتظار النتيجة'}</p>
                                                       </div>
                                                    ))}
                                                 </div>
                                              </div>
                                            )}

                                            {item.type === 'prescription' && (
                                              <div className="space-y-4 text-right">
                                                 <div className="flex flex-wrap gap-3">
                                                    {(item as any).items.map((med: any, i: number) => (
                                                       <div key={i} className="flex items-center gap-3 bg-emerald-500/5 px-5 py-3 rounded-2xl border border-emerald-500/10">
                                                          <Pill size={14} className="text-emerald-400" />
                                                          <div>
                                                             <p className="text-xs font-black text-white">{med.tradeName}</p>
                                                             <p className="text-[9px] text-slate-500 italic">{med.dosage} - {med.frequency}</p>
                                                          </div>
                                                       </div>
                                                    ))}
                                                 </div>
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                   ))}
                                </div>
                           </motion.div>
                         )}

                         {activeTab === 'history' && (
                           <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-right">
                              <h4 className="text-xs font-black text-sky-400 tracking-[5px] uppercase mb-8 italic">أرشيف المواعيد والحجوزات</h4>
                              <div className="relative pr-10 space-y-8 before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-sky-500/50 before:to-transparent">
                                 {patientAppointments.map((app) => (
                                   <div key={`hist-apt-${app.id}`} className="relative group">
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
                                 <h4 className="text-xs font-black text-emerald-500 tracking-[5px] uppercase italic">سجل الحركة المالية والمدفوعات</h4>
                                 <button className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-2xl hover:bg-emerald-500/20 transition-all uppercase italic shadow-lg shadow-emerald-500/10">
                                    <Receipt size={14}/> تصدير كشف حساب المريض
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
                                       {patientLabs.map((l) => (
                                         <tr key={`bill-lab-${l.id}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6 text-slate-400 font-mono italic text-xs tracking-widest">{l.date}</td>
                                            <td className="p-6 font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic text-xs">Lab Test: {l.testType}</td>
                                            <td className="p-6 text-emerald-400 font-black font-mono">{l.price ? l.price.toLocaleString() : '3,500'} YER</td>
                                            <td className="p-6"><span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">CLEARED</span></td>
                                         </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                              <div className="p-8 glass bg-emerald-500/5 rounded-[45px] border border-emerald-500/10 flex items-center justify-between shadow-emerald-500/5 shadow-2xl relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <div className="text-right relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mb-2 font-mono">إجمالي المستحقات المسددة</p>
                                    <h5 className="text-4xl font-black text-white italic tracking-tighter">{(5000 + patientServiceOrders.reduce((sum, so) => sum + so.price,0) + patientLabs.reduce((sum, l) => sum + (l.price || 3500), 0)).toLocaleString()} <small className="text-sm text-slate-500 not-italic font-mono uppercase">YER</small></h5>
                                 </div>
                                 <div className="p-6 bg-emerald-500/10 rounded-[30px] text-emerald-400 shadow-2xl relative z-10">
                                    <TrendingUp size={48} className="group-hover:translate-x-2 transition-transform" />
                                 </div>
                              </div>
                           </motion.div>
                         )}
                         {showLabOrderModal && selectedPatient && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-6 overflow-y-auto font-sans">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLabOrderModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-4xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-indigo-500 to-sky-500" />
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                           <FlaskConical size={32} />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-white tracking-tighter uppercase">طلب فحوصات مخبرية</h3>
                           <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase italic mt-1 font-mono">Ordering for: {selectedPatient.name}</p>
                        </div>
                     </div>
                     <button onClick={() => setShowLabOrderModal(false)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1 overflow-hidden">
                     <div className="flex flex-col gap-6 overflow-hidden">
                        <div className="relative group">
                           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                           <input 
                              type="text" 
                              placeholder="البحث عن فحص (مثلاً: CBC, Glucose)..." 
                              className="w-full pr-12 pl-6 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 text-right">
                           {masterLabTests
                             .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
                             .map(test => {
                                const isSelected = selectedOrderTests.find(s => s.id === test.id);
                                return (
                                 <button 
                                   key={test.id}
                                   onClick={() => {
                                     if (isSelected) {
                                       setSelectedOrderTests(selectedOrderTests.filter(s => s.id !== test.id));
                                     } else {
                                       setSelectedOrderTests([...selectedOrderTests, test]);
                                     }
                                   }}
                                   className={cn(
                                     "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-right group",
                                     isSelected 
                                       ? "bg-indigo-600/20 border-indigo-500/50 text-white" 
                                       : "glass border-white/5 bg-white/5 hover:bg-white/10 text-slate-400"
                                   )}
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className={cn(
                                         "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                         isSelected ? "bg-indigo-500 border-indigo-400" : "glass border-white/20"
                                       )}>
                                          {isSelected && <Plus size={14} className="text-white rotate-45" />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black uppercase tracking-tight">{test.name}</p>
                                          <p className="text-[10px] text-slate-500 italic mt-0.5">{test.category}</p>
                                       </div>
                                    </div>
                                    <p className="text-xs font-black font-mono text-emerald-400">{test.price.toLocaleString()} ر.ي</p>
                                 </button>
                                );
                             })}
                        </div>
                     </div>
                     <div className="glass bg-white/5 rounded-[40px] border border-white/5 p-8 flex flex-col shadow-inner">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                           <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">الفحوصات المختارة ({selectedOrderTests.length})</h4>
                           <button onClick={() => setSelectedOrderTests([])} className="text-[10px] text-rose-500 font-bold hover:underline">إلغاء الكل</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-8 pr-2">
                           {selectedOrderTests.length > 0 ? selectedOrderTests.map(test => (
                             <div key={`sel-${test.id}`} className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <span className="text-xs font-black text-white uppercase">{test.name}</span>
                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-black font-mono text-indigo-400">{test.price.toLocaleString()} ر.ي</span>
                                   <button onClick={() => setSelectedOrderTests(selectedOrderTests.filter(s => s.id !== test.id))} className="text-rose-500 hover:text-white transition-colors">
                                      <X size={14} />
                                   </button>
                                </div>
                             </div>
                           )) : (
                             <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                <FlaskConical size={48} className="mb-4 text-slate-700" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">No Tests Selected</p>
                             </div>
                           )}
                        </div>
                        <div className="space-y-4 pt-6 border-t border-white/10 text-right">
                           <div className="flex items-center justify-between">
                              <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">Total Amount</p>
                              <p className="text-2xl font-black text-white italic font-mono tracking-tighter">
                                 {selectedOrderTests.reduce((sum, t) => sum + t.price, 0).toLocaleString()} <span className="text-xs text-slate-500">YER</span>
                              </p>
                           </div>
                           <button 
                             onClick={handleOrderLabs}
                             disabled={selectedOrderTests.length === 0}
                             className="w-full py-5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-3xl font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all uppercase tracking-[4px] text-xs"
                           >
                              Confirm Order Request
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}

          {showServiceOrderModal && selectedPatient && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-6 overflow-y-auto font-sans">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowServiceOrderModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-2xl">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-sky-500 to-emerald-500" />
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
                           <Receipt size={32} />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-white tracking-tighter uppercase">طلب خدمة طبية</h3>
                           <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase italic mt-1 font-mono">Patient: {selectedPatient.id}</p>
                        </div>
                     </div>
                     <button onClick={() => setShowServiceOrderModal(false)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                  </div>
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Select Medical Service</label>
                        <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                           {masterServices.map(service => (
                             <button
                               key={service.id}
                               onClick={() => setSelectedOrderService(service)}
                               className={cn(
                                 "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-right group",
                                 selectedOrderService?.id === service.id ? "bg-sky-600/20 border-sky-500/50 text-white" : "glass border-white/5 bg-white/5 hover:bg-white/10 text-slate-400"
                               )}
                             >
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                     "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                     selectedOrderService?.id === service.id ? "bg-sky-500 border-sky-400" : "glass border-white/20"
                                   )}>
                                      {selectedOrderService?.id === service.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black uppercase tracking-tight">{service.name}</p>
                                      <p className="text-[10px] text-slate-500 italic mt-0.5">{service.category}</p>
                                   </div>
                                </div>
                                <p className="text-xs font-black font-mono text-emerald-400">{service.price.toLocaleString()} ر.ي</p>
                             </button>
                           ))}
                        </div>
                     </div>
                     {selectedOrderService && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 glass bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                          <div className="flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[3px] mb-1 italic">Structural Review</p>
                                <p className="text-base font-black text-white uppercase">{selectedOrderService.name}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-1 font-mono italic">Price Point</p>
                                <p className="text-xl font-black text-emerald-400 italic font-mono">{selectedOrderService.price.toLocaleString()} <small className="text-[10px] not-italic opacity-50">YER</small></p>
                             </div>
                          </div>
                       </motion.div>
                     )}
                     <div className="flex gap-6 pt-6 border-t border-white/10">
                        <button onClick={handleOrderService} disabled={!selectedOrderService} className="flex-1 py-5 bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-widest text-xs">Confirm Service Request</button>
                        <button type="button" onClick={() => setShowServiceOrderModal(false)} className="px-10 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Terminate</button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}

          {selectedLabEdit && (
             <div className="fixed inset-0 z-[230] flex items-center justify-center p-6 overflow-y-auto font-sans">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLabEdit(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 text-right my-auto shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                   <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-sky-500" />
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                            <FileText size={32} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase px-2">إدخال نتائج الفحص</h3>
                            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase italic mt-1 font-mono px-2">{selectedLabEdit.testType} - {selectedLabEdit.id}</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedLabEdit(null)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                   </div>
                   
                   <form onSubmit={handleUpdateLabResults} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 gap-4">
                         {selectedLabEdit.parameters?.map((p: any, idx: number) => (
                           <div key={p.id} className="p-6 glass rounded-3xl border border-white/5 space-y-3">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.name}</span>
                                 <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-1 rounded text-right ltr" dir="ltr">{p.normalRange} ({p.unit})</span>
                              </div>
                              <input 
                                type="text"
                                value={p.value}
                                onChange={(e) => {
                                  const newParams = [...selectedLabEdit.parameters];
                                  newParams[idx].value = e.target.value;
                                  setSelectedLabEdit({...selectedLabEdit, parameters: newParams});
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold text-center focus:border-sky-500 outline-none transition-all"
                                placeholder="..."
                              />
                           </div>
                         ))}
                      </div>

                      <div className="space-y-4 pt-6">
                         <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">ملاحظات الطبيب / المختبر</label>
                            <textarea 
                              value={selectedLabEdit.result || ''}
                              onChange={(e) => setSelectedLabEdit({...selectedLabEdit, result: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm focus:border-sky-500 outline-none transition-all h-32 resize-none text-right"
                              placeholder="أدخل ملخص النتائج أو التوصيات هنا..."
                            ></textarea>
                         </div>
                         <button type="submit" className="w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-black uppercase tracking-widest rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3">
                            <Plus size={20} /> حفظ واعتماد النتائج
                         </button>
                      </div>
                   </form>
                </motion.div>
             </div>
          )}

          {selectedLabView && (
             <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 overflow-y-auto font-sans">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLabView(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
                   {/* Report Header (Print Style) */}
                   <div className="bg-slate-900 p-10 text-white relative">
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-sky-500" />
                      <div className="flex justify-between items-start">
                         <div className="text-right">
                            <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">MedCenter Lab Report</h2>
                            <p className="text-[10px] text-sky-400 font-bold tracking-[4px] uppercase italic">التشخيص الدقيق للحياة الصحية</p>
                         </div>
                         <div className="flex gap-4">
                            <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"><Download size={20}/></button>
                            <button onClick={() => setSelectedLabView(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"><X size={20}/></button>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 mt-10 border-t border-white/10 pt-8">
                         <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Patient Name / الاسم</p>
                            <p className="text-lg font-black">{selectedPatient?.name}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">ID / الرقم الطبي</p>
                            <p className="text-lg font-black font-mono">{selectedPatient?.id}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Date / التاريخ</p>
                            <p className="text-lg font-black font-mono">{selectedLabView.date}</p>
                         </div>
                      </div>
                   </div>

                   {/* Report Body */}
                   <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden text-right">
                         <div className="bg-slate-50 p-6 border-b border-slate-200">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedLabView.testType}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Laboratory Examination Results / نتائج الفحص المخبري</p>
                         </div>
                         
                         <table className="w-full">
                            <thead>
                               <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                  <th className="p-6 text-right">Test Variable / المتغير</th>
                                  <th className="p-6 text-center">Result / النتيجة</th>
                                  <th className="p-6 text-center">Unit / الوحدة</th>
                                  <th className="p-6 text-left">Normal Range / الطبيعي</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                               {selectedLabView.parameters?.map((p: any) => (
                                 <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                       <p className="text-sm font-bold text-slate-800">{p.name}</p>
                                    </td>
                                    <td className="p-6 text-center">
                                       <span className={cn(
                                          "text-base font-black px-4 py-1.5 rounded-full",
                                          p.value && !p.normalRange?.includes(p.value) ? "bg-rose-500/10 text-rose-600" : "text-slate-900"
                                       )}>
                                          {p.value || 'N/A'}
                                       </span>
                                    </td>
                                    <td className="p-6 text-center text-slate-400 font-mono text-xs uppercase">{p.unit}</td>
                                    <td className="p-6 text-left font-mono text-xs text-slate-500 ltr" dir="ltr">{p.normalRange}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                         
                         {selectedLabView.result && (
                           <div className="p-10 bg-slate-50/50 border-t border-slate-100">
                              <p className="text-[10px] text-slate-400 font-black uppercase mb-4 tracking-widest italic">Doctor's Interpretation / ملاحظات الطبيب</p>
                              <div className="text-slate-700 leading-relaxed italic text-sm pr-6 border-r-4 border-emerald-500">
                                 {selectedLabView.result}
                              </div>
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Report Footer */}
                   <div className="bg-slate-50 p-12 border-t border-slate-200 flex justify-between items-center bg-white">
                      <div className="text-right">
                         <div className="w-32 h-1 bg-slate-900 mb-2" />
                         <p className="text-[10px] font-black text-slate-400 uppercase">Lab Director Signature</p>
                      </div>
                      <div className="text-right opacity-40">
                         <p className="text-sm font-black text-slate-900">MedCenter Health System</p>
                         <p className="text-[9px] font-medium font-mono">Verified Digital Record: {selectedLabView.id}</p>
                      </div>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
                   </div>
                </div>
             </motion.div>
           ) : (
             <div className="h-full glass rounded-[50px] flex flex-col items-center justify-center border border-white/5 p-24 text-center opacity-40 shadow-inner group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent animate-pulse" />
                <Users size={120} className="mb-10 text-slate-800 group-hover:scale-110 transition-transform duration-700" />
                <h3 className="text-4xl font-black text-slate-700 tracking-[15px] uppercase">اختر مريضاً</h3>
                <p className="text-sm text-slate-600 mt-6 leading-[2] max-w-sm font-black uppercase tracking-widest">
                   يمكنك الوصول إلى السجلات الصحية الموحدة، والتحليلات السريرية، وكشوف الحسابات المالية الموحدة.
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
                    <h3 className="text-3xl font-black text-white border-r-8 border-sky-500 pr-6 tracking-tighter uppercase">تسجيل مريض جديد</h3>
                 </div>

                 <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">الاسم الكامل (رباعي)</label>
                       <input name="name" key={prefilledName} defaultValue={prefilledName} required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all" placeholder="أدخل اسم المريض..." />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">رقم الجوال</label>
                       <input name="phone" required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono transition-all" placeholder="7XXXXXXXX" />
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
                            value={editPatientData.age || ''} 
                            onChange={(e) => setEditPatientData({...editPatientData, age: e.target.value === '' ? 0 : parseInt(e.target.value)})} 
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
