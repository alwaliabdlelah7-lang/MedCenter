import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit2, Stethoscope, Tag, Download, Printer, Search, X, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Clinic, DynamicFieldDefinition } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_CLINICS } from '../data/seedData';
import { dataStore } from '../services/dataService';
import { exportToCSV, printReport } from '../lib/exportUtils';
import { cn } from '../lib/utils';

export default function ClinicsDirectory() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptsData, clinicsData] = await Promise.all([
          dataStore.getAll<Department>('departments'),
          dataStore.getAll<Clinic>('clinics')
        ]);
        setDepartments(deptsData.length > 0 ? deptsData : INITIAL_DEPARTMENTS);
        setClinics(clinicsData.length > 0 ? clinicsData : INITIAL_CLINICS as Clinic[]);
        
        const savedFields = localStorage.getItem('hospital_dynamic_fields');
        if (savedFields) {
          const allFields: DynamicFieldDefinition[] = JSON.parse(savedFields);
          setDynamicFields(allFields.filter(f => f.entity === 'clinic' && f.isActive));
        }
      } catch (error) {
        console.error("Failed to load clinics data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const clinicData: any = {
      name: formData.get('name') as string,
      departmentId: formData.get('departmentId') as string,
      customFields: { ...(editingClinic?.customFields || {}), ...customFieldValues }
    };

    if (editingClinic) {
      const updated = { ...editingClinic, ...clinicData };
      await dataStore.updateItem('clinics', editingClinic.id, updated);
      setClinics(clinics.map(c => c.id === editingClinic.id ? updated : c));
    } else {
      const newClinic = {
        ...clinicData,
        id: `CLN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        doctorIds: []
      };
      await dataStore.addItem('clinics', newClinic);
      setClinics([...clinics, newClinic]);
    }
    
    setShowAddModal(false);
    setEditingClinic(null);
    setCustomFieldValues({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
      await dataStore.deleteItem('clinics', id);
      setClinics(clinics.filter(c => c.id !== id));
    }
  };

  const handleExportCSV = () => {
    const data = clinics.map(c => ({
      'المعرف': c.id,
      'اسم العيادة': c.name,
      'القسم التابع': departments.find(d => d.id === c.departmentId)?.name || 'غير محدد'
    }));
    exportToCSV(data, 'clinics_directory');
  };

  const filtered = clinics.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: clinics.length,
    byDept: departments.map(d => ({
      name: d.name,
      count: clinics.filter(c => c.departmentId === d.id).length
    }))
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white">جاري التحميل...</div>;

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">دليل العيادات الخارجية</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">هيكلة وتصنيف العيادات الطبية وربطها بالهيكل الإداري</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الرقم..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-bold font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('دليل العيادات', 'clinics-print-grid')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingClinic(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة عيادة جديدة</span>
          </button>
        </div>
      </div>

      {/* Summary Recap */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner border border-sky-500/20">
            <Stethoscope size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">إجمالي العيادات</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </div>
        <div className="col-span-3 glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all overflow-hidden scrollbar-hide">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/20">
            <BarChart3 size={24} />
          </div>
          <div className="flex-1 overflow-x-auto whitespace-nowrap hide-scrollbar">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">حمولة الأقسام</p>
             <div className="flex gap-2">
                {stats.byDept.filter(d => d.count > 0).map(d => (
                  <span key={d.name} className="px-3 py-1 bg-white/5 rounded-xl text-[10px] font-black text-slate-300 border border-white/5">
                    {d.name}: {d.count}
                  </span>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div id="clinics-print-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(clinic => (
          <motion.div layout key={clinic.id} className="glass p-8 rounded-[40px] group border border-white/5 hover:border-sky-500/30 hover:bg-white/5 transition-all overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -translate-x-12 -translate-y-12" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 rounded-[22px] glass bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 shadow-xl group-hover:rotate-12 transition-transform">
                <Stethoscope size={32} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 no-print">
                <button 
                  onClick={() => {
                    setEditingClinic(clinic);
                    setShowAddModal(true);
                  }}
                  className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-xl shadow-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(clinic.id)}
                  className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-xl shadow-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-black text-xl text-white mb-4 group-hover:text-sky-400 transition-colors uppercase tracking-tight">{clinic.name}</h3>
            
            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase italic tracking-widest">
                     <Building2 size={14} className="text-sky-500/50" /> القسم التابع:
                  </div>
                  <span className="text-sky-400 font-black text-xs">{departments.find(d => d.id === clinic.departmentId)?.name || 'غير محدد'}</span>
               </div>
               
               <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 font-mono font-black italic tracking-tighter">REF: {clinic.id}</span>
                  <div className="flex -space-x-2 rtl:space-x-reverse opacity-50 group-hover:opacity-100 transition-opacity">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0f172a] bg-white/10" />
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
            <Stethoscope size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">لا توجد عيادات مسجلة حالياً</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, y: 30, opacity: 0 }} 
               animate={{ scale: 1, y: 0, opacity: 1 }} 
               exit={{ scale: 0.9, y: 30, opacity: 0 }} 
               className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-[40px] shadow-2xl p-10 border border-white/10 text-right overflow-hidden transition-all"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white border-r-4 border-sky-500 pr-5">
                   {editingClinic ? 'تعديل بيانات العيادة' : 'تهيئة عيادة خارجية جديدة'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-6">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم العيادة الرسمي</label>
                  <div className="relative group">
                    <Stethoscope className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={18} />
                    <input 
                      name="name"
                      required type="text" className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 transition-all font-bold font-mono tracking-tighter"
                      placeholder="مثال: عيادة الباطنية والقلب"
                      defaultValue={editingClinic?.name}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">القسم الطبي التابع</label>
                  <select 
                    name="departmentId"
                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-black"
                    defaultValue={editingClinic?.departmentId}
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
                        <div key={field.id} className="space-y-2 text-right">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">{field.label}</label>
                          <input 
                            type={field.type}
                            defaultValue={editingClinic?.customFields?.[field.name]}
                            required={field.required}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-sky-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-sky-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-sky-600/20 hover:bg-sky-500 active:scale-95 transition-all uppercase tracking-[4px]">
                     {editingClinic ? 'تحديث العيادة' : 'تثبيت التسجيل'}
                  </button>
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
