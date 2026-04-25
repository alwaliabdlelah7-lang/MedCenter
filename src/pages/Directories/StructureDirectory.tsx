import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit2, Hospital, Stethoscope, ChevronRight, Tag, Download, Printer, Search, X, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Clinic, DynamicFieldDefinition } from '../../types';
import { INITIAL_DEPARTMENTS, INITIAL_CLINICS } from '../../data/seedData';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

export default function StructureDirectory() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
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
        setClinics(clinicsData.length > 0 ? clinicsData : INITIAL_CLINICS);
        
        const savedFields = localStorage.getItem('hospital_dynamic_fields');
        if (savedFields) {
          const allFields: DynamicFieldDefinition[] = JSON.parse(savedFields);
          setDynamicFields(allFields.filter(f => f.entity === 'department' && f.isActive));
        }
      } catch (error) {
        console.error("Failed to load structure data", error);
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
    
    const deptData: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      customFields: { ...(editingDept?.customFields || {}), ...customFieldValues }
    };

    if (editingDept) {
      const updated = { ...editingDept, ...deptData };
      await dataStore.updateItem('departments', editingDept.id, updated);
      setDepartments(departments.map(d => d.id === editingDept.id ? updated : d));
    } else {
      const newDept = {
        ...deptData,
        id: `DEPT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      };
      await dataStore.addItem('departments', newDept);
      setDepartments([...departments, newDept]);
    }
    
    setShowAddModal(false);
    setEditingDept(null);
    setCustomFieldValues({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم قطع ارتباط العيادات التابعة له.')) {
      await dataStore.deleteItem('departments', id);
      setDepartments(departments.filter(d => d.id !== id));
    }
  };

  const handleExportCSV = () => {
    const data = departments.map(d => ({
      'المعرف': d.id,
      'اسم القسم': d.name,
      'العيادات التابعة': clinics.filter(c => c.departmentId === d.id).length,
      'الوصف': d.description || ''
    }));
    exportToCSV(data, 'hospital_structure');
  };

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalDepts: departments.length,
    totalClinics: clinics.length,
    mostCrowded: departments.map(d => ({
       name: d.name,
       count: clinics.filter(c => c.departmentId === d.id).length
    })).sort((a,b) => b.count - a.count)[0]
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white italic font-black">جاري تحميل الهيكل الإداري...</div>;

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">دليل الهيكل الطبي (الأقسام)</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">نمذجة الأقسام الطبية، العيادات، وتوزيع الموارد الإدارية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم القسم..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-black font-mono tracking-tighter"
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
            onClick={() => printReport('هيكل المنشأة الطبية', 'hospital-structure-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingDept(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة قسم طبي</span>
          </button>
        </div>
      </div>

      {/* Analytics Recap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticCard icon={Hospital} label="إجمالي الأقسام" value={stats.totalDepts} color="sky" />
        <AnalyticCard icon={Stethoscope} label="إجمالي العيادات" value={stats.totalClinics} color="indigo" />
        <AnalyticCard icon={BarChart3} label="الأعلى كثافة" value={stats.mostCrowded?.name || '---'} color="pink" />
      </div>

      <div id="hospital-structure-print" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(dept => (
          <motion.div layout key={dept.id} className="glass p-8 rounded-[40px] group border border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -translate-x-12 -translate-y-12" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 rounded-[22px] glass bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl group-hover:scale-110 transition-transform">
                <Hospital size={32} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 no-print">
                <button 
                  onClick={() => {
                    setEditingDept(dept);
                    setShowAddModal(true);
                  }}
                  className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-xl shadow-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(dept.id)}
                  className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-xl shadow-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-black text-xl text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{dept.name}</h3>
            <p className="text-slate-500 text-[10px] italic font-black leading-relaxed min-h-[40px] border-r-2 border-white/5 pr-3 line-clamp-2">{dept.description}</p>
            
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                 <ChevronRight size={12} className="text-sky-500" /> قوة العيادات
              </span>
              <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-inner border border-indigo-500/10 uppercase tracking-widest italic">
                {clinics.filter(c => c.departmentId === dept.id).length} عيادات عاملة
              </span>
            </div>
            <div className="mt-4 text-[9px] text-slate-700 font-mono font-bold uppercase tracking-widest text-left">{dept.id}</div>
          </motion.div>
        ))}
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
                <h3 className="text-2xl font-black text-white border-r-4 border-indigo-500 pr-5">
                   {editingDept ? 'تعديل القسم الطبي' : 'إضافة قسم طبي جديد'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-6">
                <div className="space-y-2 text-right text-white">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">الاسم الرسمي للقسم</label>
                  <div className="relative group">
                    <Hospital size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      name="name"
                      required type="text" className="w-full pr-12 pl-4 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold font-mono tracking-tighter"
                      placeholder="مثال: قسم الجراحة العامة"
                      defaultValue={editingDept?.name}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">توصيف المهام والخدمات</label>
                  <textarea 
                    name="description"
                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold h-32 text-right"
                    placeholder="اكتب وصفاً موجزاً عن تخصصات القسم..."
                    defaultValue={editingDept?.description}
                  />
                </div>

                {/* Custom Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic">
                       <Tag size={18} />
                       بيانات إضافية مخصصة
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dynamicFields.map(field => (
                        <div key={field.id} className="space-y-2 text-right">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">{field.label}</label>
                          <input 
                            type={field.type}
                            defaultValue={editingDept?.customFields?.[field.name]}
                            required={field.required}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-indigo-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all uppercase tracking-[4px]">
                     {editingDept ? 'تحديث السجل' : 'حفظ القسم'}
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

function AnalyticCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  };

  return (
    <div className="glass p-6 rounded-[32px] border border-white/5 flex items-center gap-5 group hover:bg-white/5 transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{label}</p>
        <p className="text-xl font-black text-white mt-1 uppercase tracking-tighter truncate">{value}</p>
      </div>
    </div>
  );
}
