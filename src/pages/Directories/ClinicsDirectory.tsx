import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit2, Stethoscope, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Clinic, DynamicFieldDefinition } from '../../types';
import { INITIAL_DEPARTMENTS, INITIAL_CLINICS } from '../../data/seedData';
import { dataStore } from '../../services/dataService';

export default function ClinicsDirectory() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptsData, clinicsData] = await Promise.all([
          dataStore.getAll<Department>('departments'),
          dataStore.getAll<Clinic>('clinics')
        ]);
        setDepartments(deptsData.length > 0 ? deptsData : INITIAL_DEPARTMENTS);
        setClinics(clinicsData.length > 0 ? clinicsData : INITIAL_CLINICS as Clinic[]);
      } catch (error) {
        console.error("Failed to load clinics data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    if (saved) {
      const allFields: DynamicFieldDefinition[] = JSON.parse(saved);
      setDynamicFields(allFields.filter(f => f.entity === 'clinic' && f.isActive));
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClinic, setNewClinic] = useState({ name: '', departmentId: departments[0]?.id || '' });

  useEffect(() => {
    localStorage.setItem('hospital_clinics', JSON.stringify(clinics));
  }, [clinics]);

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinic.name) return;
    
    const clinic: Clinic = { 
      id: `C-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, 
      ...newClinic, 
      doctorIds: [],
      customFields: customFieldValues
    };

    await dataStore.addItem('clinics', clinic);
    setClinics([...clinics, clinic]);
    setNewClinic({ name: '', departmentId: departments[0]?.id || '' });
    setCustomFieldValues({});
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">دليل العيادات الخارجية</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">إضافة وتخصيص العيادات وربطها بالأقسام الطبية</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة عيادة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clinics.map(clinic => (
          <motion.div layout key={clinic.id} className="glass p-8 rounded-[40px] group border border-white/5 hover:bg-white/5 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 rounded-[22px] glass bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 shadow-xl">
                <Stethoscope size={32} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 text-slate-400 hover:text-sky-400 glass-card rounded-xl shadow-lg shadow-sky-600/20 transition-all"><Edit2 size={16} /></button>
                <button className="p-2.5 text-slate-400 hover:text-rose-400 glass-card rounded-xl shadow-lg shadow-rose-600/20 transition-all" onClick={() => setClinics(clinics.filter(c => c.id !== clinic.id))}><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-black text-xl text-white mb-4">{clinic.name}</h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-sky-400 font-black bg-sky-500/10 w-fit px-4 py-2 rounded-2xl border border-sky-500/20 uppercase tracking-widest italic">
              <Building2 size={12} />
              <span>القسم: {departments.find(d => d.id === clinic.departmentId)?.name}</span>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2">
               <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">#{clinic.id}</span>
            </div>
          </motion.div>
        ))}
        {clinics.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
            <Stethoscope size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">No Clinics Configured</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-[40px] shadow-2xl p-10 border border-white/10 text-right">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-sky-500 pr-5">تهيئة عيادة خارجية جديدة</h3>
              <form onSubmit={handleAddClinic} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم العيادة</label>
                  <input 
                    required type="text" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 transition-all font-bold"
                    placeholder="مثال: عيادة العظام 1"
                    value={newClinic.name}
                    onChange={(e) => setNewClinic({...newClinic, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم الطبي التابع</label>
                  <select 
                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-black"
                    value={newClinic.departmentId}
                    onChange={(e) => setNewClinic({...newClinic, departmentId: e.target.value})}
                  >
                    {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                  </select>
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

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-sky-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-sky-600/20 hover:bg-sky-500 active:scale-95 transition-all uppercase tracking-[4px]">حفظ العيادة</button>
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
