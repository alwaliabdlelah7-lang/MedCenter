import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit2, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Department, DynamicFieldDefinition } from '../../types';
import { YEMEN_SERVICES, INITIAL_DEPARTMENTS } from '../../data/seedData';
import { dataStore } from '../../services/dataService';

export default function ServicesDirectory() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptsData, servicesData] = await Promise.all([
          dataStore.getAll<Department>('departments'),
          dataStore.getAll<Service>('services')
        ]);
        setDepartments(deptsData.length > 0 ? deptsData : INITIAL_DEPARTMENTS);
        setServices(servicesData.length > 0 ? servicesData : YEMEN_SERVICES.map((s, idx) => ({
          ...s,
          id: `SRV-SEED-${idx}`,
          departmentId: (s as any).departmentId || deptsData[0]?.id || 'dept-1',
          revenueAccountId: 'REV-GEN'
        })) as Service[]);
      } catch (error) {
        console.error("Failed to load services data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: 0, departmentId: departments[0]?.id || '', revenueAccountId: 'REV-001' });

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'service' && f.isActive));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hospital_services', JSON.stringify(services));
  }, [services]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name) return;
    
    const service: Service = { 
      id: `S-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, 
      ...newService,
      customFields: customFieldValues 
    } as Service;

    await dataStore.addItem('services', service);
    setServices([...services, service]);
    setNewService({ name: '', price: 0, departmentId: departments[0]?.id || '', revenueAccountId: 'REV-001' });
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل الخدمات الطبية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">تعريف قائمة الفحوصات والخدمات، الأسعار، وربطها بحسابات الإيرادات</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة خدمة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <motion.div layout key={`${service.id}-${idx}`} className="glass p-8 rounded-[40px] group border border-white/5 hover:bg-white/5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -translate-x-12 -translate-y-12" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 rounded-[22px] glass bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-xl">
                <Tag size={28} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl"><Edit2 size={16} /></button>
                <button className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl" onClick={() => setServices(services.filter(s => s.id !== service.id))}><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="font-black text-lg text-white mb-1">{service.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mb-4">
              <Building2 size={12} />
              <span>{departments.find(d => d.id === service.departmentId)?.name}</span>
            </div>
            
            <div className="mt-8 flex items-end justify-between pt-6 border-t border-white/5 relative z-10">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-tighter italic">سعر الخدمة</span>
                <span className="text-xl font-black text-white">{service.price.toLocaleString()} <small className="text-[10px] font-bold text-slate-500">ر.ي</small></span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-tighter italic">حساب الإيراد</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20 font-black font-mono">{service.revenueAccountId}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-emerald-500 pr-5">تعريف خدمة طبية جديدة</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup name="name" label="اسم الخدمة" placeholder="مثال: معاينة استشارية" icon={Tag} required />
                  <InputGroup name="price" label="سعر الخدمة" placeholder="مثال: 5000" icon={DollarSign} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم الطبي</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black" value={newService.departmentId} onChange={(e) => setNewService({...newService, departmentId: e.target.value})}>
                      {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">حساب الإيرادات</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black" value={newService.revenueAccountId} onChange={(e) => setNewService({...newService, revenueAccountId: e.target.value})}>
                      <option value="REV-001" className="bg-slate-900">إيرادات العيادات</option>
                      <option value="REV-002" className="bg-slate-900">إيرادات الفحوصات</option>
                      <option value="REV-003" className="bg-slate-900">إيرادات أخرى</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 italic">
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

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all uppercase tracking-[4px]">حفظ الخدمة</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-500 py-5 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-[4px]">إلغاء</button>
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
          <input name={name} required={required} className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all" placeholder={placeholder} />
       </div>
    </div>
  );
}
