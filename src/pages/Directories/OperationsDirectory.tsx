import React, { useState, useEffect } from 'react';
import { Plus, Search, Scissors, Trash2, Edit2, Building2, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Operation, Department, DynamicFieldDefinition } from '../../types';
import { INITIAL_DEPARTMENTS } from '../../data/seedData';

export default function OperationsDirectory() {
  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem('hospital_operations');
    return saved ? JSON.parse(saved) : [];
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
      setDynamicFields(allFields.filter(f => f.entity === 'operation' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('hospital_operations', JSON.stringify(operations));
  }, [operations]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const operation: Operation = {
      id: `OP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: formData.get('name') as string,
      cost: Number(formData.get('cost')),
      departmentId: (formData.get('departmentId') as string) || departments[0]?.id || '',
      customFields: customFieldValues
    };
    
    setOperations([...operations, operation]);
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  const filtered = operations.filter(op => 
    op.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل العمليات الجراحية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">تعريف قائمة العمليات الجراحية، التكاليف، والأقسام المسؤولة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن عملية..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-72 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة عملية جديدة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((op) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={op.id}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[22px] bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-xl">
                    <Scissors size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">{op.name}</h3>
                    <p className="text-rose-400 text-[10px] font-black uppercase mt-1 tracking-widest italic">العمليات والتدخلات الجراحية</p>
                    <div className="mt-2">
                       <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">#{op.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl"><Edit2 size={16}/></button>
                   <button 
                    onClick={() => setOperations(operations.filter(o => o.id !== op.id))}
                    className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-tighter italic">القسم الطبي</span>
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Building2 size={12} className="text-rose-500" />
                    <span>{departments.find(d => d.id === op.departmentId)?.name || 'غير محدد'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-tighter italic">تكلفة العملية</span>
                  <div className="flex items-center gap-2 text-white font-black text-xs">
                    <DollarSign size={12} className="text-emerald-500" />
                    <span>{op.cost.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50 text-center">
            <Scissors size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">No Operations Defined</p>
            <p className="text-xs text-slate-500 mt-2">ابدأ بتعريف قائمة العمليات الجراحية المتاحة في المنشأة</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-rose-500 pr-5">تعريف عملية جراحية جديدة</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup name="name" label="اسم العملية" placeholder="مثال: استئصال الزائدة" icon={Scissors} required />
                  <InputGroup name="cost" label="سعر العملية" placeholder="مثال: 50000" icon={DollarSign} required />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم المسؤول</label>
                   <select name="departmentId" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black">
                     {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                   </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">ملاحظات وشروط (اختياري)</label>
                  <textarea name="notes" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold min-h-[100px]" placeholder="أي تفاصيل أو متطلبات للعملية..."></textarea>
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 italic">
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-rose-500 font-bold"
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
                                className="w-5 h-5 accent-rose-500"
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
                              className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-rose-500 font-bold"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 py-5 bg-rose-600 text-white rounded-3xl font-black shadow-2xl shadow-rose-600/20 hover:bg-rose-500 transition-all uppercase tracking-[4px]">تأكيد الحفظ</button>
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
          <input name={name} required={required} className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-rose-500 transition-all" placeholder={placeholder} />
       </div>
    </div>
  );
}
