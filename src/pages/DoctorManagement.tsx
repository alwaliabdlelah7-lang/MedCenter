import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Building2, 
  Phone, 
  DollarSign, 
  Clock, 
  Calendar,
  Activity as ActivityIcon,
  ChevronRight,
  User as UserIcon,
  Tag,
  Download,
  Printer,
  BarChart3,
  X,
  Mail,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Doctor, Department, DynamicFieldDefinition } from '../types';
import { cn } from '../lib/utils';
import { INITIAL_DOCTORS, INITIAL_DEPARTMENTS } from '../data/seedData';
import { dataStore } from '../services/dataService';
import { exportToCSV, printReport } from '../lib/exportUtils';
import { validateEmail } from '../lib/validationUtils';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docsData, deptsData] = await Promise.all([
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Department>('departments')
        ]);
        setDoctors(docsData.length > 0 ? docsData : INITIAL_DOCTORS);
        setDepartments(deptsData.length > 0 ? deptsData : INITIAL_DEPARTMENTS);
        
        const savedFields = localStorage.getItem('hospital_dynamic_fields');
        if (savedFields) {
          const allFields: DynamicFieldDefinition[] = JSON.parse(savedFields);
          setDynamicFields(allFields.filter(f => f.entity === 'doctor' && f.isActive));
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const email = formData.get('email') as string;
    if (email && !validateEmail(email)) {
      alert('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    
    const docData: any = {
      name: formData.get('name') as string,
      specialization: formData.get('specialization') as string,
      phone: formData.get('phone') as string,
      mobile: formData.get('mobile') as string,
      fax: formData.get('fax') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      gender: formData.get('gender') as 'male' | 'female',
      notes: formData.get('notes') as string,
      departmentId: formData.get('departmentId') as string,
      percentage: Number(formData.get('percentage')),
      consultationFee: Number(formData.get('consultationFee')),
      followupFee: Number(formData.get('followupFee')),
      returnDays: Number(formData.get('returnDays')),
      workingDays: editingDoctor?.workingDays || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: editingDoctor?.workingHours || { start: '08:00', end: '20:00' },
      customFields: { ...(editingDoctor?.customFields || {}), ...customFieldValues }
    };

    if (editingDoctor) {
      const updated = { ...editingDoctor, ...docData };
      await dataStore.updateItem('doctors', editingDoctor.id, updated);
      setDoctors(doctors.map(d => d.id === editingDoctor.id ? updated : d));
    } else {
      const newDoc = {
        ...docData,
        id: `DOC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };
      await dataStore.addItem('doctors', newDoc);
      setDoctors([...doctors, newDoc]);
    }
    
    setShowAddModal(false);
    setEditingDoctor(null);
    setCustomFieldValues({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف الطبيب؟')) {
      await dataStore.deleteItem('doctors', id);
      setDoctors(doctors.filter(d => d.id !== id));
    }
  };

  const handleExportCSV = () => {
    const exportData = doctors.map(d => ({
      'المعرف': d.id,
      'الاسم': d.name,
      'التخصص': d.specialization,
      'القسم': departments.find(dept => dept.id === d.departmentId)?.name || 'غير محدد',
      'رسوم الكشف': d.consultationFee,
      'نسبة الطبيب': d.percentage,
      'الهاتف': d.mobile || d.phone || '',
      'العنوان': d.address || ''
    }));
    exportToCSV(exportData, 'doctors_directory');
  };

  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: doctors.length,
    activeSpecializations: new Set(doctors.map(d => d.specialization)).size,
    avgFee: doctors.length ? Math.round(doctors.reduce((acc, d) => acc + d.consultationFee, 0) / doctors.length) : 0
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white">جاري التحميل...</div>;

  return (
    <div className="space-y-8 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">إدارة الكادر الطبي والخبراء</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">تتبع ساعات العمل، الرسوم، والبيانات المهنية للفريق الطبي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو التخصص..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('تقرير الكادر الطبي', 'doctors-report-list')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingDoctor(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة كادر جديد</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard icon={UserIcon} label="إجمالي الأطباء" value={stats.total} color="sky" />
        <SummaryCard icon={Stethoscope} label="تخصص طبي" value={stats.activeSpecializations} color="pink" />
        <SummaryCard icon={DollarSign} label="متوسط الكشفية" value={`${stats.avgFee.toLocaleString()} ر.ي`} color="emerald" />
      </div>

      <div id="doctors-report-list" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((doctor) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={doctor.id}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:border-sky-500/30 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-6">
                  <div className="relative">
                     <div className="w-16 h-16 rounded-[22px] bg-sky-500/10 flex items-center justify-center text-sky-400 border-2 border-sky-500/20 shadow-xl group-hover:scale-110 transition-transform">
                        <UserIcon size={32} />
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0f172a] rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors">{doctor.name}</h3>
                    <p className="text-sm text-sky-400/70 font-black italic mt-1">{doctor.specialization}</p>
                    <div className="flex items-center gap-4 mt-3">
                       <span className="text-[10px] bg-white/5 px-2 py-1 rounded-lg text-slate-500 font-mono font-bold">ID: {doctor.id}</span>
                       <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold"><Building2 size={12}/> {departments.find(d => d.id === doctor.departmentId)?.name || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 no-print">
                   <button 
                    onClick={() => {
                      setEditingDoctor(doctor);
                      setShowAddModal(true);
                    }}
                    className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-xl shadow-lg transition-all"
                   >
                     <Edit2 size={18}/>
                   </button>
                   <button 
                    onClick={() => handleDelete(doctor.id)}
                    className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-xl shadow-lg transition-all"
                   >
                     <Trash2 size={18}/>
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 relative z-10">
                 <StatItem icon={DollarSign} label="رسم المعاينة" value={`${doctor.consultationFee.toLocaleString()} ر.ي`} color="emerald" />
                 <StatItem icon={Clock} label="ساعات العمل" value={`${doctor.workingHours.start} - ${doctor.workingHours.end}`} color="amber" />
                 <StatItem icon={Calendar} label="أيام العمل" value={`${doctor.workingDays.length} أيام`} color="sky" />
                 <StatItem icon={ActivityIcon} label="نسبة الطبيب" value={`${doctor.percentage}%`} color="indigo" />
              </div>

              <div className="mt-8 flex items-center justify-between relative z-10 pt-6 border-t border-white/5">
                 <div className="flex gap-2">
                    {doctor.workingDays.map(day => (
                      <span key={day} className="w-8 h-8 rounded-xl glass bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase hover:bg-sky-500 hover:text-white transition-colors tracking-tighter">
                        {day.substring(0,3)}
                      </span>
                    ))}
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                     <Phone size={12} /> {doctor.mobile || doctor.phone || '---'}
                   </span>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
         {showAddModal && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }} 
                animate={{ scale: 1, y: 0, opacity: 1 }} 
                exit={{ scale: 0.9, y: 20, opacity: 0 }} 
                className="relative w-full max-w-4xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh] shadow-2xl custom-scrollbar"
              >
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-white border-r-4 border-sky-500 pr-5">
                      {editingDoctor ? 'تعديل بيانات الكادر الطبي' : 'إضافة كادر طبي / استشاري جديد'}
                    </h3>
                    <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                 </div>

                  <form className="space-y-6" onSubmit={handleAddOrUpdate}>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup name="name" label="اسم الطبيب الكامل" defaultValue={editingDoctor?.name} icon={UserIcon} required />
                        <InputGroup name="specialization" label="التخصص المهني" defaultValue={editingDoctor?.specialization} icon={Stethoscope} required />
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase italic block">القسم</label>
                           <select 
                            name="departmentId" 
                            required 
                            defaultValue={editingDoctor?.departmentId}
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold"
                           >
                             {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <InputGroup name="consultationFee" label="رسم المعاينة" defaultValue={editingDoctor?.consultationFee} type="number" icon={DollarSign} required />
                        <InputGroup name="percentage" label="نسبة الطبيب (%)" defaultValue={editingDoctor?.percentage} type="number" icon={ActivityIcon} required />
                        <InputGroup name="followupFee" label="رسوم المراجعة" defaultValue={editingDoctor?.followupFee} type="number" icon={DollarSign} />
                        <InputGroup name="returnDays" label="فترة المراجعة (يوم)" defaultValue={editingDoctor?.returnDays} type="number" icon={Calendar} />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputGroup name="phone" label="الهاتف" defaultValue={editingDoctor?.phone} icon={Phone} />
                        <InputGroup name="mobile" label="الجوال السيار" defaultValue={editingDoctor?.mobile} icon={Phone} />
                        <InputGroup name="email" label="البريد الإلكتروني" defaultValue={editingDoctor?.email} type="email" icon={Mail} />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup name="address" label="عنوان العيادة / السكن" defaultValue={editingDoctor?.address} icon={MapPin} />
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase italic block">الجنس</label>
                           <select name="gender" defaultValue={editingDoctor?.gender || 'male'} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                             <option value="male" className="bg-slate-900">ذكر</option>
                             <option value="female" className="bg-slate-900">أنثى</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase italic block">ملاحظات مهنية / سيرة ذاتية مختصره</label>
                        <textarea name="notes" defaultValue={editingDoctor?.notes} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold min-h-[100px]" placeholder="أدخل الملاحظات هنا..."></textarea>
                     </div>

                     {dynamicFields.length > 0 && (
                        <div className="pt-6 border-t border-white/5 space-y-6">
                           <h4 className="text-sm font-black text-sky-400 flex items-center gap-2 italic uppercase"><Tag size={18}/> بيانات إضافية مخصصة</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {dynamicFields.map(field => (
                               <div key={field.id} className="space-y-2 text-right">
                                  <label className="text-[10px] font-black text-slate-500 uppercase italic">{field.label}</label>
                                  <input 
                                    type={field.type}
                                    defaultValue={editingDoctor?.customFields?.[field.name]}
                                    required={field.required}
                                    onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-sky-500" 
                                  />
                               </div>
                             ))}
                           </div>
                        </div>
                     )}

                     <div className="pt-8 flex gap-4">
                        <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-[4px]">
                          {editingDoctor ? 'تحديث البيانات' : 'تثبيت التسجيل الطبي'}
                        </button>
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

function SummaryCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="glass p-6 rounded-[32px] border border-white/5 flex items-center gap-5 group hover:bg-white/5 transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    sky: "text-sky-400 bg-sky-400/10",
    indigo: "text-indigo-400 bg-indigo-400/10"
  };
  
  return (
    <div className="space-y-2 p-3 glass-card rounded-2xl border border-white/5 bg-white/5">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", colors[color])}>
          <Icon size={12} />
        </div>
        <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
      </div>
      <p className="text-xs font-black text-white pr-7">{value}</p>
    </div>
  );
}

function InputGroup({ name, label, defaultValue, placeholder, icon: Icon, required, type = "text" }: any) {
  return (
    <div className="space-y-2 text-right">
      <label className="text-[10px] font-black text-slate-500 uppercase italic">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={18} />}
        <input 
          name={name}
          type={type}
          defaultValue={isNaN(defaultValue) ? '' : defaultValue}
          required={required}
          className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-sky-500 transition-all font-mono"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
