import React, { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical, Beaker, Trash2, Edit2, DollarSign, Tag, Info, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YEMEN_LAB_TESTS as SEED_TESTS } from '../../data/seedData';
import { MasterLabItem, LabTestParameter, DynamicFieldDefinition } from '../../types';
import { cn } from '../../lib/utils';

export default function LabDirectory() {
  const [tests, setTests] = useState<MasterLabItem[]>(() => {
    const saved = localStorage.getItem('hospital_master_lab_tests');
    if (saved) return JSON.parse(saved);
    return SEED_TESTS.map((t, i) => ({
      id: `LBT-${i + 1}`,
      name: t.name,
      price: t.price,
      category: 'عام',
      parameters: []
    }));
  });

  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<MasterLabItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTest, setNewTest] = useState<Partial<MasterLabItem>>({
    name: '',
    price: 0,
    category: 'عام',
    description: '',
    parameters: []
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'lab_test' && f.isActive));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hospital_master_lab_tests', JSON.stringify(tests));
  }, [tests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.name || !newTest.price) return;
    
    if (editingTest) {
      setTests(tests.map(t => t.id === editingTest.id ? { ...editingTest, ...newTest, customFields: customFieldValues } as MasterLabItem : t));
    } else {
      const test: MasterLabItem = {
        id: `LBT-${Date.now().toString().slice(-4)}`,
        name: newTest.name!,
        price: newTest.price!,
        category: newTest.category!,
        description: newTest.description,
        parameters: newTest.parameters || [],
        customFields: customFieldValues
      };
      setTests([...tests, test]);
    }
    
    setShowModal(false);
    setEditingTest(null);
    setNewTest({ name: '', price: 0, category: 'عام', description: '', parameters: [] });
    setCustomFieldValues({});
  };

  const handleEdit = (test: MasterLabItem) => {
    setEditingTest(test);
    setNewTest(test);
    setCustomFieldValues(test.customFields || {});
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
      setTests(tests.filter(t => t.id !== id));
    }
  };

  const addParameter = () => {
    const params = [...(newTest.parameters || [])];
    params.push({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      unit: '',
      normalRange: ''
    });
    setNewTest({ ...newTest, parameters: params });
  };

  const updateParameter = (id: string, field: keyof LabTestParameter, value: string) => {
    const params = (newTest.parameters || []).map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setNewTest({ ...newTest, parameters: params });
  };

  const removeParameter = (id: string) => {
    setNewTest({ ...newTest, parameters: (newTest.parameters || []).filter(p => p.id !== id) });
  };

  const filtered = tests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل الفحوصات المخبرية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">إدارة البنود المخبرية ومكونات كل فحص بالتفصيل</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن فحص أو كود..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setEditingTest(null);
              setNewTest({ name: '', price: 0, category: 'عام', description: '', parameters: [] });
              setCustomFieldValues({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة بند فحص</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((test) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={test.id}
            className="glass p-6 rounded-3xl relative group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl glass bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Beaker size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(test)}
                  className="p-2 text-slate-400 hover:text-sky-400 glass-card bg-white/5 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className="p-2 text-slate-400 hover:text-rose-400 glass-card bg-white/5 rounded-lg" 
                  onClick={() => handleDelete(test.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-white mb-1">{test.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <Tag size={12} className="text-sky-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{test.category}</span>
                <span className="text-[10px] text-slate-500 font-mono italic">#{test.id}</span>
              </div>
              
              {test.parameters && test.parameters.length > 0 && (
                <div className="mb-4 space-y-1">
                   <p className="text-[9px] text-slate-500 font-black uppercase mb-2">مكونات الفحص ({test.parameters.length}):</p>
                   <div className="flex flex-wrap gap-2">
                      {test.parameters.slice(0, 3).map(p => (
                        <span key={p.id} className="text-[10px] px-2 py-0.5 glass bg-white/5 rounded-md text-slate-300 border border-white/5">{p.name}</span>
                      ))}
                      {test.parameters.length > 3 && <span className="text-[10px] text-slate-500 italic">+{test.parameters.length - 3} أخرى</span>}
                   </div>
                </div>
              )}

              {test.description && <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic">{test.description}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-xl font-black text-white">{test.price.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">ر.ي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                   <FlaskConical size={14} className="text-emerald-400" />
                </div>
                {test.parameters && test.parameters.length > 0 && (
                   <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Activity size={14} className="text-indigo-400" />
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl glass bg-slate-900/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-indigo-500 pr-5">
                 {editingTest ? 'تعديل بيانات الفحص' : 'إضافة بند فحص مخبري جديد'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم الفحص الرئيسي</label>
                    <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold" value={newTest.name} onChange={(e) => setNewTest({...newTest, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">التسعيرة (ر.ي)</label>
                      <input type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-black" value={newTest.price} onChange={(e) => setNewTest({...newTest, price: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">التصنيف</label>
                      <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 appearance-none font-bold" value={newTest.category} onChange={(e) => setNewTest({...newTest, category: e.target.value})}>
                        <option className="bg-slate-900">عام</option>
                        <option className="bg-slate-900">هرمونات</option>
                        <option className="bg-slate-900">كيمياء حيوية</option>
                        <option className="bg-slate-900">أحياء دقيقة</option>
                        <option className="bg-slate-900">دمويات</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic">
                         <Activity size={18} />
                         مكونات وباراميترات الفحص
                      </h4>
                      <button 
                        type="button"
                        onClick={addParameter}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors"
                      >
                         <Plus size={16} />
                         إضافة باراميتر
                      </button>
                   </div>

                   <div className="space-y-4">
                      {newTest.parameters?.map((p, idx) => (
                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 glass bg-white/5 rounded-3xl border border-white/5 relative">
                           <button 
                             type="button"
                             onClick={() => removeParameter(p.id)}
                             className="absolute -top-2 -left-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
                           >
                              <X size={14} />
                           </button>
                           <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 font-bold uppercase">الاسم</label>
                              <input 
                                className="w-full px-3 py-2 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs text-right"
                                value={p.name}
                                onChange={(e) => updateParameter(p.id, 'name', e.target.value)}
                                placeholder="مثلاً: Glucose"
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 font-bold uppercase">الوحدة</label>
                              <input 
                                className="w-full px-3 py-2 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs text-right"
                                value={p.unit}
                                onChange={(e) => updateParameter(p.id, 'unit', e.target.value)}
                                placeholder="mg/dL"
                              />
                           </div>
                           <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] text-slate-500 font-bold uppercase">المجال الطبيعي (Normal Range)</label>
                              <input 
                                className="w-full px-3 py-2 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-mono text-right"
                                value={p.normalRange}
                                onChange={(e) => updateParameter(p.id, 'normalRange', e.target.value)}
                                placeholder="70 - 100"
                              />
                           </div>
                        </div>
                      ))}
                      {(!newTest.parameters || newTest.parameters.length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-3xl text-slate-500 italic text-xs">
                           لا توجد باراميترات محددة لهذا الفحص حالياً. اضغط "إضافة" لتعريف المكونات.
                        </div>
                      )}
                   </div>
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic">
                       <Tag size={18} />
                       بيانات إضافية مخصصة
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold text-right"
                            >
                              <option value="" className="bg-slate-900 text-right">-- اختر --</option>
                              {field.options?.map(opt => <option key={opt} value={opt} className="bg-slate-900 text-right">{opt}</option>)}
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold text-right"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">ملاحظات إضافية / تعليمات قبل الفحص</label>
                  <textarea className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 h-24 font-bold" value={newTest.description} onChange={(e) => setNewTest({...newTest, description: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[25px] font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all uppercase tracking-widest text-sm">
                    {editingTest ? 'تحديث الفحص' : 'حفظ البند'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-10 glass bg-white/5 text-slate-400 py-5 rounded-[25px] font-bold hover:bg-white/10 transition-colors uppercase tracking-widest text-sm">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
