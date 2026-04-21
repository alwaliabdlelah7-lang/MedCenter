import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit2, Hospital, Stethoscope, ChevronRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Clinic, DynamicFieldDefinition } from '../../types';
import { INITIAL_DEPARTMENTS, INITIAL_CLINICS } from '../../data/seedData';

export default function StructureDirectory() {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('hospital_departments');
    if (saved) return JSON.parse(saved);
    return INITIAL_DEPARTMENTS as Department[];
  });

  const [clinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('hospital_clinics');
    if (saved) return JSON.parse(saved);
    return INITIAL_CLINICS as Clinic[];
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'department' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  useEffect(() => {
    localStorage.setItem('hospital_departments', JSON.stringify(departments));
  }, [departments]);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name) return;
    setDepartments([...departments, { 
      id: `DEPT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, 
      ...newDept,
      customFields: customFieldValues
    }]);
    setNewDept({ name: '', description: '' });
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل الأقسام الطبية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">إدارة الهيكل الإداري والمراكز الطبية داخل المنشأة</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة قسم طبي</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => (
          <motion.div layout key={dept.id} className="glass p-8 rounded-[40px] group border border-white/5 hover:bg-white/5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -translate-x-12 -translate-y-12" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 rounded-[22px] glass bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl">
                <Hospital size={32} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl shadow-lg shadow-sky-600/20 transition-all"><Edit2 size={16} /></button>
                <button className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl shadow-lg shadow-rose-600/20 transition-all" onClick={() => setDepartments(departments.filter(d => d.id !== dept.id))}><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-black text-xl text-white mb-2">{dept.name}</h3>
            <p className="text-slate-500 text-sm italic font-medium leading-relaxed min-h-[40px]">{dept.description}</p>
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                 <ChevronRight size={12} className="text-sky-500" /> العيادات التابعة
              </span>
              <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-xl text-xs font-black shadow-inner">
                {clinics.filter(c => c.departmentId === dept.id).length} عيادة
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-[40px] shadow-2xl p-10 border border-white/10 text-right">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-indigo-500 pr-5">إضافة قسم طبي جديد</h3>
              <form onSubmit={handleAddDept} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم القسم</label>
                  <input 
                    required type="text" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                    placeholder="مثال: قسم القلب والأوعية الدموية"
                    value={newDept.name}
                    onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">وصف القسم (اختياري)</label>
                  <textarea 
                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold h-32"
                    placeholder="اكتب وصفاً موجزاً عن تخصصات القسم..."
                    value={newDept.description}
                    onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                  />
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic">
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold"
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
                                className="w-5 h-5 accent-indigo-500"
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all uppercase tracking-[4px]">حفظ القسم</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-500 py-5 rounded-3xl font-black hover:bg-white/10 transition-colors uppercase tracking-[4px]">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
