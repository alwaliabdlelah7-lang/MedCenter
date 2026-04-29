import React, { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical, Beaker, Trash2, Edit2, DollarSign, Tag, Info, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YEMEN_LAB_TESTS as SEED_TESTS } from '../../data/seedData';
import { MasterLabItem, LabTestParameter, DynamicFieldDefinition } from '../../types';
import { cn } from '../../lib/utils';
import { dataStore } from '../../services/dataService';

export default function LabDirectory() {
  const [tests, setTests] = useState<MasterLabItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataStore.getAll<MasterLabItem>('master_lab_tests');
        if (data.length === 0) {
          const seeded = SEED_TESTS.map((t, i) => ({
            id: `LBT-${i + 1}`,
            name: t.name,
            price: t.price,
            category: t.category || 'عام',
            isProfile: t.isProfile || false,
            parameters: t.parameters || []
          }));
          setTests(seeded);
          // Optional: Add to DB if empty
          seeded.forEach(item => dataStore.addItem('master_lab_tests', item));
        } else {
          setTests(data);
        }
      } catch (error) {
        console.error("Failed to load lab tests", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.name || !newTest.price) return;
    
    if (editingTest) {
      const updated = { ...editingTest, ...newTest, customFields: customFieldValues } as MasterLabItem;
      await dataStore.updateItem('master_lab_tests', updated.id, updated);
      setTests(tests.map(t => t.id === editingTest.id ? updated : t));
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
      await dataStore.addItem('master_lab_tests', test);
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

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا البند؟ سيتم حذفه من قاعدة البيانات.')) {
      try {
        await dataStore.deleteItem('master_lab_tests', id);
        setTests(tests.filter(t => t.id !== id));
      } catch (error) {
        console.error("Failed to delete lab test", error);
        alert("فشل في حذف البند. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const addParameter = () => {
    const params = [...(newTest.parameters || [])];
    params.push({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      unit: '',
      normalRange: '',
      minRange: 0,
      maxRange: 0,
      gender: 'both'
    });
    setNewTest({ ...newTest, parameters: params });
  };

  const updateParameter = (id: string, field: keyof LabTestParameter, value: any) => {
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
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">إدارة البنود المخبرية ومكونات كل فحص بالتفصيل الدقيق</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن فحص..." 
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
            <span>إضافة فحص جديد</span>
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
            className="glass p-6 rounded-3xl relative group flex flex-col justify-between border border-white/5 hover:border-indigo-500/30 transition-all"
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
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-white">{test.name}</h3>
                {test.isProfile && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">PROFILE</span>}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Tag size={12} className="text-sky-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{test.category}</span>
                <span className="text-[10px] text-slate-500 font-mono italic">#{test.id}</span>
              </div>
              
              {test.parameters && test.parameters.length > 0 && (
                <div className="mb-4 space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1">
                      <Activity size={10} />
                      المكونات ({test.parameters.length}):
                   </p>
                   <div className="grid grid-cols-2 gap-2">
                      {test.parameters.slice(0, 4).map(p => (
                        <div key={p.id} className="flex flex-col gap-0.5">
                           <span className="text-[10px] text-slate-300 font-bold truncate">{p.name}</span>
                           <span className="text-[9px] text-slate-500 font-mono">{p.normalRange} <small>{p.unit}</small></span>
                        </div>
                      ))}
                   </div>
                   {test.parameters.length > 4 && (
                     <div className="pt-1 mt-1 border-t border-white/5 text-center">
                        <span className="text-[9px] text-slate-500 italic">+{test.parameters.length - 4} باراميترات إضافية</span>
                     </div>
                   )}
                </div>
              )}

              {test.description && <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic leading-relaxed">{test.description}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-xl font-black text-white">{test.price.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">ر.ي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg" title="متوفر">
                   <FlaskConical size={14} className="text-emerald-400" />
                </div>
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
              className="relative w-full max-w-5xl glass bg-slate-900/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh] custom-scrollbar shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white border-r-4 border-indigo-500 pr-5">
                   {editingTest ? 'تعديل بيانات الفحص' : 'إضافة فحص مخبري جديد'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-3 glass bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم الفحص (بالعربية/الإنجليزية)</label>
                    <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold" value={newTest.name} onChange={(e) => setNewTest({...newTest, name: e.target.value})} placeholder="مثلاً: فحص دم شامل (CBC)" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">التسعيرة (ر.ي)</label>
                    <input type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-black" value={newTest.price || ''} onChange={(e) => setNewTest({...newTest, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">التصنيف</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 appearance-none font-bold" value={newTest.category} onChange={(e) => setNewTest({...newTest, category: e.target.value})}>
                      <option className="bg-slate-900">عام</option>
                      <option className="bg-slate-900">دمويات</option>
                      <option className="bg-slate-900">كيمياء حيوية</option>
                      <option className="bg-slate-900">أحياء دقيقة</option>
                      <option className="bg-slate-900">هرمونات</option>
                      <option className="bg-slate-900">مناعة</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                           <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={newTest.isProfile} 
                              onChange={(e) => setNewTest({...newTest, isProfile: e.target.checked})}
                           />
                           <div className={`w-12 h-6 rounded-full transition-colors ${newTest.isProfile ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                           <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${newTest.isProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">هل هذا الفحص عبارة عن مجموعة (Profile)؟</span>
                     </label>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <Activity size={20} className="text-indigo-400" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic">
                               مكونات وباراميترات الفحص الدقيقة
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium">أضف المكونات، الوحدات، والمجالات الطبيعية لكل باراميتر (مطابق للمعايير في اليمن)</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={addParameter}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10"
                      >
                         <Plus size={16} className="text-indigo-400" />
                         إضافة باراميتر
                      </button>
                   </div>

                   <div className="space-y-3">
                      {newTest.parameters && newTest.parameters.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                           {newTest.parameters.map((p, idx) => (
                             <motion.div 
                               key={p.id}
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 glass bg-white/5 rounded-2xl border border-white/5 relative items-end shadow-sm"
                             >
                                <div className="lg:col-span-3 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">اسم المكون (Parameter)</label>
                                   <input 
                                     className="w-full px-4 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-bold"
                                     value={p.name}
                                     onChange={(e) => updateParameter(p.id, 'name', e.target.value)}
                                     placeholder="e.g. Hemoglobin"
                                   />
                                </div>
                                <div className="lg:col-span-2 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">الوحدة (Unit)</label>
                                   <input 
                                     className="w-full px-4 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-mono"
                                     value={p.unit}
                                     onChange={(e) => updateParameter(p.id, 'unit', e.target.value)}
                                     placeholder="mg/dL"
                                   />
                                </div>
                                <div className="lg:col-span-3 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">المجال الطبيعي (Textual Reference)</label>
                                   <input 
                                     className="w-full px-4 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-medium"
                                     value={p.normalRange}
                                     onChange={(e) => updateParameter(p.id, 'normalRange', e.target.value)}
                                     placeholder="13.5 - 17.5"
                                   />
                                </div>
                                <div className="lg:col-span-1 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">أقل قيمة</label>
                                   <input 
                                     type="number"
                                     step="any"
                                     className="w-full px-4 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-black text-center"
                                     value={p.minRange || ''}
                                     onChange={(e) => updateParameter(p.id, 'minRange', parseFloat(e.target.value))}
                                   />
                                </div>
                                <div className="lg:col-span-1 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">أعلى قيمة</label>
                                   <input 
                                     type="number"
                                     step="any"
                                     className="w-full px-4 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-black text-center"
                                     value={p.maxRange || ''}
                                     onChange={(e) => updateParameter(p.id, 'maxRange', parseFloat(e.target.value))}
                                   />
                                </div>
                                <div className="lg:col-span-1 space-y-1">
                                   <label className="text-[9px] text-slate-500 font-bold uppercase pr-1">الجنس</label>
                                   <select 
                                     className="w-full px-2 py-2.5 glass bg-white/10 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-[10px] font-bold"
                                     value={p.gender}
                                     onChange={(e) => updateParameter(p.id, 'gender', e.target.value)}
                                   >
                                      <option value="both">الكل</option>
                                      <option value="male">ذكر</option>
                                      <option value="female">أنثى</option>
                                   </select>
                                </div>
                                <div className="lg:col-span-1 flex items-end pb-1.5">
                                   <button 
                                     type="button"
                                     onClick={() => removeParameter(p.id)}
                                     className="w-full py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-rose-500/20"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             </motion.div>
                           ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[30px] flex flex-col items-center gap-3">
                           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                              <Info size={24} />
                           </div>
                           <p className="text-slate-500 italic text-sm font-medium">
                              لا توجد باراميترات محددة لهذا الفحص حالياً.
                              <br />
                              <span className="text-[10px] text-slate-600 not-italic">يرجى إضافة المكونات لتخصيص نتائج الفحص بدقة.</span>
                           </p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">وصف الفحص / شروط الصيام أو التحضيرات</label>
                  <textarea className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-3xl text-white outline-none focus:border-indigo-500 h-28 font-bold leading-relaxed" value={newTest.description} onChange={(e) => setNewTest({...newTest, description: e.target.value})} placeholder="اكتب تعليمات المريض هنا..." />
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

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[25px] font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all text-sm uppercase tracking-widest">
                    {editingTest ? 'تحديث الفحص المخبري' : 'حفظ بيانات الفحص'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-10 glass bg-white/5 text-slate-400 py-5 rounded-[25px] font-bold hover:bg-white/10 transition-colors text-sm">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
