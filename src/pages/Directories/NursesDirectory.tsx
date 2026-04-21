import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCheck, Phone, Syringe, Building2, Trash2, Edit2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Nurse, Department, DynamicFieldDefinition } from '../../types';

export default function NursesDirectory() {
  const [nurses, setNurses] = useState<Nurse[]>(() => {
    const saved = localStorage.getItem('hospital_nurses');
    return saved ? JSON.parse(saved) : [];
  });

  const [departments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('hospital_departments');
    return saved ? JSON.parse(saved) : [];
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'nurse' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNurse, setNewNurse] = useState<Partial<Nurse>>({
    name: '',
    phone: '',
    departmentId: '',
  });

  useEffect(() => {
    localStorage.setItem('hospital_nurses', JSON.stringify(nurses));
  }, [nurses]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const nurse: Nurse = {
      id: `N-DR-${Math.random().toString(36).substr(2, 6)}`,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      mobile: formData.get('mobile') as string,
      gender: formData.get('gender') as 'male' | 'female',
      address: formData.get('address') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string,
      departmentId: (formData.get('departmentId') as string) || departments[0]?.id || '',
      customFields: customFieldValues
    };
    
    setNurses([...nurses, nurse]);
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  const filteredNurses = nurses.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل الممرضين والكوادر المساعدة</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">إدارة طاقم التمريض وتوزيعهم على الأقسام الطبية المختلفة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-72 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-600/30 hover:bg-pink-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة كادر جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNurses.length > 0 ? (
          filteredNurses.map((nurse) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={nurse.id}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[22px] bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                    <UserCheck size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{nurse.name}</h3>
                    <p className="text-pink-400 text-[10px] font-black uppercase mt-1">طاقم التمريض • {nurse.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">#{nurse.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl"><Edit2 size={16}/></button>
                   <button 
                    onClick={() => setNurses(nurses.filter(n => n.id !== nurse.id))}
                    className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                  <Building2 size={16} className="text-pink-500/50" />
                  <span>القسم: {departments.find(d => d.id === nurse.departmentId)?.name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                    <Phone size={16} className="text-pink-500/50" />
                    <span>والجوال: {nurse.mobile || nurse.phone || 'لا يوجد'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
            <Syringe size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">No Nurses Found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-pink-500 pr-5">تسجيل ممرض/ة جديد في المنظومة</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup name="name" label="الاسم الكامل" placeholder="مثال: ياسمين أحمد" icon={UserCheck} required />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">الجنس</label>
                    <select name="gender" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                      <option value="female" className="bg-slate-900">أنثى</option>
                      <option value="male" className="bg-slate-900">ذكر</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup name="phone" label="رقم الهاتف" placeholder="01XXXXXX" icon={Phone} />
                  <InputGroup name="mobile" label="رقم الجوال (السيار)" placeholder="77XXXXXXX" icon={Phone} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم المختص</label>
                      <select name="departmentId" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                        {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                   </div>
                   <InputGroup name="email" label="البريد الإلكتروني" placeholder="nurse@mail.com" icon={UserCheck} />
                </div>

                <InputGroup name="address" label="العنوان" placeholder="مثال: صنعاء - حي الأصبحي" icon={Building2} />

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">ملاحظات إضافية</label>
                  <textarea name="notes" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold min-h-[100px]" placeholder="أي تفاصيل أخرى..."></textarea>
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-pink-400 uppercase tracking-widest flex items-center gap-2 italic">
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
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 font-bold"
                            >
                              <option value="" className="bg-slate-900">-- اختر --</option>
                              {field.options?.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                            </select>
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-3 p-4 glass bg-white/5 rounded-2xl border border-white/5 justify-start">
                              <input 
                                type="checkbox" 
                                checked={!!customFieldValues[field.id]}
                                onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.checked })}
                                className="w-5 h-5 accent-pink-500"
                              />
                              <span className="text-sm font-bold text-slate-300">أكد الاختيار</span>
                            </div>
                          ) : (
                            <input 
                              type={field.type} 
                              required={field.required}
                              placeholder={field.label}
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 font-bold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 py-5 bg-pink-600 text-white rounded-3xl font-black shadow-2xl shadow-pink-600/20 hover:bg-pink-500 transition-all uppercase tracking-[4px]">حفظ البيانات</button>
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

function InputGroup({ name, label, placeholder, icon: Icon, required }: { name: string, label: string, placeholder: string, icon: any, required?: boolean }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-500 uppercase italic">{label}</label>
       <div className="relative">
          <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600/50" size={18} />
          <input name={name} required={required} className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 transition-all" placeholder={placeholder} />
       </div>
    </div>
  );
}
