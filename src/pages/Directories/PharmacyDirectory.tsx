import React, { useState, useEffect } from 'react';
import { Plus, Search, Pill, Trash2, Edit2, DollarSign, Package, ClipboardList, Info, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YEMEN_MEDICINES as SEED_MEDS } from '../../data/seedData';
import { MasterMedicine, DynamicFieldDefinition } from '../../types';
import { cn } from '../../lib/utils';

export default function PharmacyDirectory() {
  const [medicines, setMedicines] = useState<MasterMedicine[]>(() => {
    const saved = localStorage.getItem('hospital_master_medicines');
    if (saved) return JSON.parse(saved);
    return SEED_MEDS.map((m, i) => ({
      id: `MED-M-${i + 1}`,
      tradeName: m.tradeName,
      scientificName: m.scientificName,
      category: 'أدوية عامة',
      price: m.price,
      unit: 'علبة',
      dosageForm: 'حبوب',
      totalQuantity: 100,
      reorderPoint: 20
    }));
  });

  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MasterMedicine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMed, setNewMed] = useState<Partial<MasterMedicine>>({
    tradeName: '',
    scientificName: '',
    category: 'أدوية عامة',
    price: 0,
    unit: 'علبة',
    dosageForm: 'حبوب',
    totalQuantity: 0,
    reorderPoint: 5
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'medicine' && f.isActive));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hospital_master_medicines', JSON.stringify(medicines));
  }, [medicines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.tradeName || !newMed.scientificName) return;
    
    if (editingMed) {
      setMedicines(medicines.map(m => m.id === editingMed.id ? { ...editingMed, ...newMed, customFields: customFieldValues } as MasterMedicine : m));
    } else {
      const med: MasterMedicine = {
        id: `MED-${Date.now().toString().slice(-4)}`,
        tradeName: newMed.tradeName!,
        scientificName: newMed.scientificName!,
        category: newMed.category!,
        price: newMed.price || 0,
        unit: newMed.unit!,
        dosageForm: newMed.dosageForm!,
        totalQuantity: newMed.totalQuantity || 0,
        reorderPoint: newMed.reorderPoint || 0,
        description: newMed.description,
        customFields: customFieldValues
      };
      setMedicines([...medicines, med]);
    }
    
    setShowModal(false);
    setEditingMed(null);
    setNewMed({ tradeName: '', scientificName: '', category: 'أدوية عامة', price: 0, unit: 'علبة', dosageForm: 'حبوب', totalQuantity: 0, reorderPoint: 5 });
    setCustomFieldValues({});
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const handleEdit = (med: MasterMedicine) => {
    setEditingMed(med);
    setNewMed(med);
    setCustomFieldValues(med.customFields || {});
    setShowModal(true);
  };

  const filtered = medicines.filter(m => 
    m.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل الأصناف الصيدلانية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-emerald-500 pr-3 font-medium">تعريف الأدوية والمستلزمات الطبية في النظام</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم التجاري أو العلمي..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-emerald-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setEditingMed(null);
              setNewMed({ tradeName: '', scientificName: '', category: 'أدوية عامة', price: 0, unit: 'علبة', dosageForm: 'حبوب', totalQuantity: 0, reorderPoint: 5 });
              setCustomFieldValues({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة صنف دوائي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((med, idx) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={`${med.id}-${idx}`}
            className="glass p-6 rounded-3xl relative group flex flex-col justify-between overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 flex flex-col h-full ${med.totalQuantity <= med.reorderPoint ? 'bg-rose-500' : 'bg-emerald-500'}`} title={med.totalQuantity <= med.reorderPoint ? 'مخزون منخفض' : 'مخزون كافٍ'} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl glass bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Pill size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(med)}
                  className="p-2 text-slate-400 hover:text-emerald-400 glass-card bg-white/5 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className="p-2 text-slate-400 hover:text-rose-400 glass-card bg-white/5 rounded-lg" 
                  onClick={() => handleDelete(med.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="relative">
              <h3 className="font-bold text-xl text-white mb-0.5">{med.tradeName}</h3>
              <p className="text-emerald-400 text-[11px] font-mono tracking-wide mb-3 italic">{med.scientificName}</p>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <ClipboardList size={12} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{med.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package size={12} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{med.dosageForm}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                 <p className="text-[10px] text-slate-500 font-bold uppercase">السعر المعتمد</p>
                 <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-white">{med.price.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold">ر.ي</span>
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-slate-500 font-bold uppercase">المخزون المتوفر</span>
                 <span className={cn(
                   "text-lg font-black",
                   med.totalQuantity <= med.reorderPoint ? "text-rose-400" : "text-emerald-400"
                 )}>
                   {med.totalQuantity} <span className="text-[10px] opacity-60">{med.unit}</span>
                 </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-emerald-500 pr-5">
                {editingMed ? 'تعديل بيانات الصنف' : 'تعريف صنف دوائي جديد'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-8 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-2 justify-start"> <Package size={12}/> الاسم التجاري </label>
                    <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold" value={newMed.tradeName} onChange={(e) => setNewMed({...newMed, tradeName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-2 justify-start"> <Info size={12}/> الاسم العلمي </label>
                    <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold" value={newMed.scientificName} onChange={(e) => setNewMed({...newMed, scientificName: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">السعر (ر.ي)</label>
                    <input type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-black" value={newMed.price} onChange={(e) => setNewMed({...newMed, price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">النوع (الجرعة)</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold appearance-none" value={newMed.dosageForm} onChange={(e) => setNewMed({...newMed, dosageForm: e.target.value})}>
                      <option value="حبوب" className="bg-slate-900">حبوب/كبسولات</option>
                      <option value="شراب" className="bg-slate-900">شراب/سائل</option>
                      <option value="حقن" className="bg-slate-900">حقن/إبر</option>
                      <option value="مرهم" className="bg-slate-900">مرهم/كريم</option>
                      <option value="قطرة" className="bg-slate-900">قطرة</option>
                      <option value="بخاخ" className="bg-slate-900">بخاخ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">الوحدة</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold appearance-none" value={newMed.unit} onChange={(e) => setNewMed({...newMed, unit: e.target.value})}>
                      <option value="علبة" className="bg-slate-900">علبة</option>
                      <option value="شريط" className="bg-slate-900">شريط</option>
                      <option value="حبة" className="bg-slate-900">حبة</option>
                      <option value="كيس" className="bg-slate-900">كيس</option>
                      <option value="قنينة" className="bg-slate-900">قنينة/فارار</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">التصنيف</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 appearance-none font-bold italic" value={newMed.category} onChange={(e) => setNewMed({...newMed, category: e.target.value})}>
                      <option className="bg-slate-900">أدوية عامة</option>
                      <option className="bg-slate-900">مضادات حيوية</option>
                      <option className="bg-slate-900">مسكنات</option>
                      <option className="bg-slate-900">أدوية مزمنة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">الكمية المتوفرة حالياً</label>
                      <input type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-black" value={newMed.totalQuantity} onChange={(e) => setNewMed({...newMed, totalQuantity: parseInt(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase italic">حد إعادة الطلب (تنبيه المخزون)</label>
                      <input type="number" required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500 font-black" value={newMed.reorderPoint} onChange={(e) => setNewMed({...newMed, reorderPoint: parseInt(e.target.value)})} />
                   </div>
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 italic">
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold"
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
                                className="w-5 h-5 accent-emerald-500"
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-bold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white py-5 rounded-[25px] font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all uppercase tracking-widest text-sm text-center">
                    {editingMed ? 'تحديث البيانات' : 'حفظ الصنف'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-10 glass bg-white/5 text-slate-400 py-5 rounded-[25px] font-bold hover:bg-white/10 transition-colors uppercase tracking-widest text-sm text-center">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
