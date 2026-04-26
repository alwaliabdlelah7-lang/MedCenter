import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCheck, Phone, Syringe, Building2, Trash2, Edit2, Tag, Download, Printer, BarChart3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Nurse, Department, DynamicFieldDefinition } from '../../types';
import { exportToCSV, printReport } from '../../lib/exportUtils';

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
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('hospital_nurses', JSON.stringify(nurses));
  }, [nurses]);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (editingNurse) {
      const updatedNurse: Nurse = {
        ...editingNurse,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        mobile: formData.get('mobile') as string,
        gender: formData.get('gender') as 'male' | 'female',
        address: formData.get('address') as string,
        email: formData.get('email') as string,
        notes: formData.get('notes') as string,
        departmentId: formData.get('departmentId') as string,
        customFields: { ...editingNurse.customFields, ...customFieldValues }
      };
      setNurses(nurses.map(n => n.id === editingNurse.id ? updatedNurse : n));
      setEditingNurse(null);
    } else {
      const nurse: Nurse = {
        id: `N-DR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
    }
    
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  const filteredNurses = nurses.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: nurses.length,
    male: nurses.filter(n => n.gender === 'male').length,
    female: nurses.filter(n => n.gender === 'female').length,
    byDept: departments.map(d => ({
      name: d.name,
      count: nurses.filter(n => n.departmentId === d.id).length
    }))
  };

  const handleExportCSV = () => {
    if (!nurses.length) return;
    const exportData = nurses.map(n => ({
      'المعرف': n.id,
      'الاسم': n.name,
      'الجنس': n.gender === 'male' ? 'ذكر' : 'أنثى',
      'القسم': departments.find(d => d.id === n.departmentId)?.name || 'غير محدد',
      'رقم التواصل': n.mobile || n.phone || '',
      'البريد': n.email || '',
      'العنوان': n.address || ''
    }));
    exportToCSV(exportData, 'nurses_directory');
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">دليل الكادر التمريضي</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">إدارة شاملة لتمريض وأخصائيي المركز الطبي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الرقم..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
            title="تصدير للبيانات"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('سجل الكادر التمريضي', 'nurses-list')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
            title="طباعة السجل"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingNurse(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-pink-600/30 hover:bg-pink-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة كادر جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">إجمالي الكادر</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </div>
        <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">ذكور</p>
            <p className="text-xl font-black text-white">{stats.male}</p>
          </div>
        </div>
        <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">إناث</p>
            <p className="text-xl font-black text-white">{stats.female}</p>
          </div>
        </div>
        <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Building2 size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase italic">تغطية الأقسام</p>
            <div className="flex gap-2 text-[10px] font-black overflow-x-auto whitespace-nowrap hide-scrollbar mt-1">
              {stats.byDept.filter(d => d.count > 0).map(d => (
                <span key={d.name} className="bg-white/5 px-2 py-0.5 rounded text-white border border-white/5">{d.name} ({d.count})</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="nurses-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNurses.length > 0 ? (
          filteredNurses.map((nurse, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={`${nurse.id}-${idx}`}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:border-pink-500/30 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500/5 blur-3xl rounded-full -translate-x-12 -translate-y-12" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[22px] bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform shadow-inner">
                    <UserCheck size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-pink-400 transition-colors">{nurse.name}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase mt-1">طاقم التمريض • {nurse.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono font-bold tracking-tighter">ID: {nurse.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 no-print">
                   <button 
                    onClick={() => {
                      setEditingNurse(nurse);
                      setShowAddModal(true);
                    }}
                    className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-xl transition-all shadow-sm"
                   >
                     <Edit2 size={16}/>
                   </button>
                   <button 
                    onClick={() => {
                      if(confirm('هل أنت متأكد من حذف هذا السجل بشكل نهائي؟')) {
                        setNurses(nurses.filter(n => n.id !== nurse.id));
                      }
                    }}
                    className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-xl transition-all shadow-sm"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                    <Building2 size={16} className="text-pink-500/50" />
                    <span>القسم المختص</span>
                  </div>
                  <span className="text-white font-black text-xs">{departments.find(d => d.id === nurse.departmentId)?.name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                    <Phone size={16} className="text-pink-500/50" />
                    <span>رقم التواصل</span>
                  </div>
                  <span className="text-white font-black text-xs font-mono">{nurse.mobile || nurse.phone || '---'}</span>
                </div>
                
                {nurse.email && (
                  <div className="text-[10px] text-slate-500 font-bold border-t border-white/5 pt-3 mt-2 truncate italic">
                    {nurse.email}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
            <Syringe size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">لا يوجد ممرضين حالياً في هذا القسم</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }} 
              className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white border-r-4 border-pink-500 pr-5">
                  {editingNurse ? 'تعديل بيانات الكادر' : 'تسجيل كادر جديد في المنظومة'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">الاسم الكامل</label>
                    <input name="name" defaultValue={editingNurse?.name} required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all" placeholder="مثال: ياسمين أحمد" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic text-right block">الجنس</label>
                    <select name="gender" defaultValue={editingNurse?.gender || 'female'} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                      <option value="female" className="bg-slate-900">أنثى</option>
                      <option value="male" className="bg-slate-900">ذكر</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">رقم الهاتف الأرضي</label>
                    <input name="phone" defaultValue={editingNurse?.phone} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all font-mono" placeholder="01XXXXXX" />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">رقم الجوال السيار</label>
                    <input name="mobile" defaultValue={editingNurse?.mobile} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all font-mono" placeholder="77XXXXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic text-right block">القسم المختص</label>
                      <select name="departmentId" defaultValue={editingNurse?.departmentId} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                        {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">البريد الإلكتروني المهني</label>
                    <input name="email" type="email" defaultValue={editingNurse?.email} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all" placeholder="example@mail.com" />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">السكن / العنوان</label>
                  <input name="address" defaultValue={editingNurse?.address} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all" placeholder="صنعاء - حي الأصبحي" />
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">ملاحظات الملف الإداري</label>
                  <textarea name="notes" defaultValue={editingNurse?.notes} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold min-h-[100px] focus:border-pink-500 transition-all" placeholder="أي تفاصيل أخرى تخص الأداء أو المهام..."></textarea>
                </div>

                {/* Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-pink-400 uppercase tracking-widest flex items-center gap-2 italic">
                       <Tag size={18} />
                       حقول البيانات المخصصة
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dynamicFields.map(field => (
                        <div key={field.id} className="space-y-2 text-right">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">{field.label}</label>
                          <input 
                            type={field.type}
                            defaultValue={editingNurse?.customFields?.[field.name]}
                            required={field.required}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-pink-500 transition-all" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-pink-600 text-white rounded-3xl font-black shadow-2xl shadow-pink-600/20 hover:bg-pink-500 transition-all uppercase tracking-[4px]">
                    {editingNurse ? 'تحديث السجل' : 'حفظ البيانات'}
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
