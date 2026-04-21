import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Phone, Trash2, Edit2, ShieldAlert, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Companion, DynamicFieldDefinition } from '../../types';

export default function CompanionsDirectory() {
  const [companions, setCompanions] = useState<Companion[]>(() => {
    const saved = localStorage.getItem('hospital_companions');
    return saved ? JSON.parse(saved) : [];
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'companion' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCompanion, setNewCompanion] = useState<Partial<Companion>>({
    name: '',
    phone: '',
    idNumber: '',
  });

  useEffect(() => {
    localStorage.setItem('hospital_companions', JSON.stringify(companions));
  }, [companions]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanion.name) return;
    
    const companion: Companion = {
      id: `C-MP-${Math.random().toString(36).substr(2, 6)}`,
      name: newCompanion.name!,
      phone: newCompanion.phone || '',
      idNumber: newCompanion.idNumber || '',
      customFields: customFieldValues
    };
    
    setCompanions([...companions, companion]);
    setCustomFieldValues({});
    setShowAddModal(false);
    setNewCompanion({ name: '', phone: '', idNumber: '' });
  };

  const filteredCompanions = companions.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.idNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل المرافقين</h2>
          <p className="text-sm text-sky-300/70">إدارة بيانات المراقبين والمرافقين للمرضى المنومين</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن مرافق..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة مرافق</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanions.length > 0 ? (
          filteredCompanions.map((comp) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={comp.id}
              className="glass p-6 rounded-3xl relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl glass bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Users size={32} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 text-slate-400 hover:text-sky-400 transition-colors">
                     <Edit2 size={16} />
                   </button>
                   <button 
                    onClick={() => setCompanions(companions.filter(c => c.id !== comp.id))}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">{comp.name}</h3>
                <p className="text-slate-500 text-xs font-bold uppercase mt-1">مرافق معتمد</p>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 text-slate-300">
                  <ShieldAlert size={16} className="text-sky-500/50" />
                  <span className="text-sm font-mono tracking-wider">{comp.idNumber || 'رقم الهوية غير مسجل'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone size={16} className="text-sky-500/50" />
                  <span className="text-sm">{comp.phone || 'لا يوجد هاتف'}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-white/10 rounded-3xl glass bg-white/5">
            <Users size={48} className="mb-4 opacity-10" />
            <p className="font-medium text-slate-300">لا يوجد مرافقون مسجلون حالياً</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold mb-6 text-white">إضافة مرافق جديد</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">اسم المرافق الكامل</label>
                  <input required type="text" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500" value={newCompanion.name} onChange={(e) => setNewCompanion({...newCompanion, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">رقم الهوية</label>
                  <input type="text" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" value={newCompanion.idNumber} onChange={(e) => setNewCompanion({...newCompanion, idNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">رقم الهاتف</label>
                  <input type="text" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono" value={newCompanion.phone} onChange={(e) => setNewCompanion({...newCompanion, phone: e.target.value})} />
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
                        <div key={field.id} className="space-y-2 text-right">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select 
                              required={field.required}
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
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
                                className="w-5 h-5 accent-sky-500"
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-6">
                  <button type="submit" className="flex-1 bg-sky-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-sky-600/30">حفظ البيانات</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-400 py-4 rounded-2xl font-bold">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
