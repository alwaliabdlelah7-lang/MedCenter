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
  UserCheck,
  ChevronRight,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Doctor, Department, DynamicFieldDefinition } from '../types';
import { cn } from '../lib/utils';
import { INITIAL_DOCTORS, INITIAL_DEPARTMENTS } from '../data/seedData';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [departments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('hospital_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'doctor' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('hospital_doctors', JSON.stringify(doctors));
  }, [doctors]);

  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة موارد الأطباء والكوادر</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">جدولة ساعات العمل، تحديد الرسوم، وتتبع أداء الأطباء</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو التخصص..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-72 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setCustomFieldValues({});
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة كادر جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((doctor) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={doctor.id}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-6">
                  <div className="relative">
                     <img src={`https://picsum.photos/seed/${doctor.id}/64/64`} className="w-16 h-16 rounded-[22px] border-2 border-white/10 shadow-xl" alt={doctor.name} referrerPolicy="no-referrer" />
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#1e293b] rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{doctor.name}</h3>
                    <p className="text-sm text-sky-400 font-bold italic mt-1">{doctor.specialization}</p>
                    <div className="flex items-center gap-4 mt-3">
                       <span className="text-[10px] bg-white/5 px-2 py-1 rounded-lg text-slate-500 font-mono font-bold">#{doctor.id}</span>
                       <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold"><Building2 size={12}/> {departments.find(d => d.id === doctor.departmentId)?.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl"><Edit2 size={18}/></button>
                   <button className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl"><Trash2 size={18}/></button>
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
                      <span key={day} className="w-6 h-6 rounded-lg glass bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">{day.substring(0,2)}</span>
                    ))}
                 </div>
                 <button className="flex items-center gap-2 px-6 py-2.5 bg-sky-600/10 text-sky-400 border border-sky-600/20 rounded-2xl text-xs font-black shadow-inner hover:bg-sky-600 hover:text-white transition-all">
                    عرض إحصائيات الأداء <ChevronRight size={14} />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
         {showAddModal && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-3xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh] custom-scrollbar">
                 <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-sky-500 pr-5">إضافة كادر طبي / استشاري جديد</h3>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    
                    const newDoc: any = {
                      id: `D-${Date.now().toString().slice(-4)}`,
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
                      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
                      workingHours: { start: '08:00', end: '20:00' },
                      customFields: customFieldValues
                    };
                    
                    setDoctors([...doctors, newDoc]);
                    setShowAddModal(false);
                    setCustomFieldValues({});
                  }}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup name="name" label="اسم الطبيب الكامل" placeholder="د. مثال: صالح أحمد" icon={UserIcon} required />
                        <InputGroup name="specialization" label="التخصص الدقيق" placeholder="مثال: استشاري قلب وأوعية" icon={Stethoscope} required />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase italic">الجنس</label>
                           <select name="gender" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                              <option value="male" className="bg-slate-900">ذكر</option>
                              <option value="female" className="bg-slate-900">أنثى</option>
                           </select>
                        </div>
                        <InputGroup name="phone" label="تلفون المنزل" placeholder="01XXXXXX" icon={Phone} />
                        <InputGroup name="mobile" label="الجوال (السيار)" placeholder="77XXXXXXX" icon={Phone} />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup name="email" label="البريد الإلكتروني" placeholder="example@mail.com" icon={UserIcon} />
                        <InputGroup name="fax" label="الفاكس" placeholder="XXXXXXX" icon={Phone} />
                     </div>

                     <div className="space-y-2">
                        <InputGroup name="address" label="العنوان السكني" placeholder="المدينة - الشارع" icon={Building2} />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم التابع له</label>
                           <select name="departmentId" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                              {departments.map(dept => <option key={dept.id} value={dept.id} className="bg-slate-900">{dept.name}</option>)}
                           </select>
                        </div>
                        <InputGroup name="percentage" label="نسبة الطبيب (%)" placeholder="مثال: 70" icon={ActivityIcon} />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputGroup name="consultationFee" label="رسوم المعاينة الأولى" placeholder="مثال: 8000" icon={DollarSign} />
                        <InputGroup name="followupFee" label="رسوم المتابعة" placeholder="مثال: 4000" icon={DollarSign} />
                        <InputGroup name="returnDays" label="أيام العودة المجانية" placeholder="مثال: 7" icon={Calendar} />
                     </div>

                     {/* Dynamic Custom Fields */}
                     {dynamicFields.length > 0 && (
                       <div className="space-y-6 pt-6 border-t border-white/5">
                         <h4 className="text-sm font-black text-sky-400 uppercase tracking-widest flex items-center gap-2 italic">
                            <Tag size={18} />
                            بيانات إضافية مخصصة
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {dynamicFields.map(field => (
                             <div key={field.id} className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 uppercase italic">
                                 {field.label} {field.required && <span className="text-rose-500">*</span>}
                               </label>
                               {field.type === 'select' ? (
                                 <select 
                                   required={field.required}
                                   onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                                   className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                                 >
                                   <option value="" className="bg-slate-900">-- اختر --</option>
                                   {field.options?.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                 </select>
                               ) : field.type === 'boolean' ? (
                                 <div className="flex items-center gap-3 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                                   <input 
                                     type="checkbox" 
                                     onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.checked })}
                                     className="w-5 h-5 accent-sky-500"
                                   />
                                   <span className="text-sm font-bold text-slate-300">أكد الاختيار</span>
                                 </div>
                               ) : (
                                 <input 
                                   type={field.type} 
                                   required={field.required}
                                   placeholder={field.label}
                                   onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                                   className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                                 />
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase italic">ملاحظات إضافية</label>
                        <textarea name="notes" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold min-h-[100px]" placeholder="أي تفاصيل أخرى تخص الطبيب..."></textarea>
                     </div>

                     <div className="pt-6 flex gap-4">
                        <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/20 hover:bg-sky-500 transition-all uppercase tracking-[4px]">تأكيد الحفظ</button>
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

function StatItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="p-4 glass bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center text-center">
       <div className={cn("p-2 rounded-xl mb-3", `bg-${color}-500/10 text-${color}-400`)}>
          <Icon size={16} />
       </div>
       <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-tighter italic">{label}</p>
       <p className="text-white text-xs font-black truncate w-full px-2">{value}</p>
    </div>
  );
}

function InputGroup({ name, label, placeholder, icon: Icon, required }: { name: string, label: string, placeholder: string, icon: any, required?: boolean }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-500 uppercase italic">{label}</label>
       <div className="relative">
          <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input name={name} required={required} className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" placeholder={placeholder} />
       </div>
    </div>
  );
}
