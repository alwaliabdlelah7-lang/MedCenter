import React, { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical, Beaker, FileText, Trash2, CheckCircle, Clock, Download, Printer, X, Edit2, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LabTest, Doctor, MasterLabItem, Patient } from '../types';
import { YEMEN_LAB_TESTS } from '../data/seedData';
import { dataStore } from '../services/dataService';
import { exportToCSV, printReport } from '../lib/exportUtils';
import { cn } from '../lib/utils';

export default function Laboratory() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [masterTests, setMasterTests] = useState<MasterLabItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [showResultModal, setShowResultModal] = useState<LabTest | null>(null);
  const [resultParams, setResultParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [testsData, doctorsData, masterData, patientsData] = await Promise.all([
          dataStore.getAll<LabTest>('lab_tests'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<MasterLabItem>('master_lab_tests'),
          dataStore.getAll<Patient>('patients')
        ]);
        setTests(testsData);
        setDoctors(doctorsData);
        setMasterTests(masterData.length > 0 ? masterData : YEMEN_LAB_TESTS);
        setPatients(patientsData);
      } catch (error) {
        console.error("Failed to load lab data", error);
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
    
    const patientId = formData.get('patientId') as string;
    const patient = patients.find(p => p.id === patientId);
    const testId = formData.get('testId') as string;
    const master = masterTests.find(m => m.id === testId);

    const testData: any = {
      patientId,
      patientName: patient?.name || 'مريض غير معروف',
      testType: master?.name || 'فحص غير محدد',
      testId,
      doctorId: formData.get('doctorId') as string,
      date: formData.get('date') as string,
    };

    if (editingTest) {
      const updated = { ...editingTest, ...testData };
      await dataStore.updateItem('lab_tests', editingTest.id, updated);
      setTests(tests.map(t => t.id === editingTest.id ? updated : t));
    } else {
      const newTest = {
        ...testData,
        id: `LAB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'pending' as const
      };
      await dataStore.addItem('lab_tests', newTest);
      setTests([...tests, newTest]);
    }
    
    setShowAddModal(false);
    setEditingTest(null);
  };

  const updateResults = async (id: string) => {
    const updates = { status: 'completed' as const, parameterResults: resultParams };
    await dataStore.updateItem<LabTest>('lab_tests', id, updates);
    setTests(tests.map(t => t.id === id ? { ...t, ...updates } : t));
    setShowResultModal(null);
    setResultParams({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الفحص؟')) {
      await dataStore.deleteItem('lab_tests', id);
      setTests(tests.filter(t => t.id !== id));
    }
  };

  const handleExportCSV = () => {
    const data = tests.map(t => ({
      'المعرف': t.id,
      'المريض': t.patientName,
      'الفحص': t.testType,
      'الطبيب': doctors.find(d => d.id === t.doctorId)?.name || 'غير محدد',
      'الحالة': t.status === 'pending' ? 'بالانتظار' : 'مكتمل',
      'التاريخ': t.date
    }));
    exportToCSV(data, 'laboratory_reports');
  };

  const filtered = tests.filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tests.length,
    pending: tests.filter(t => t.status === 'pending').length,
    completed: tests.filter(t => t.status === 'completed').length,
    today: tests.filter(t => t.date === new Date().toISOString().split('T')[0]).length
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">إدارة المختبر والتحاليل الطبية</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">تتبع الفحوصات المخبرية، إصدار النتائج، والأرشفة الطبية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم المريض أو الفحص..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-bold font-mono tracking-tighter"
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
            onClick={() => printReport('تقرير المختبر الموحد', 'lab-tests-print-list')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingTest(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>طلب فحص جديد</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryItem icon={BarChart3} label="إجمالي الفحوصات" value={stats.total} color="sky" />
        <SummaryItem icon={Clock} label="قيد المعالجة" value={stats.pending} color="amber" />
        <SummaryItem icon={CheckCircle} label="مكتملة" value={stats.completed} color="emerald" />
        <SummaryItem icon={TrendingUp} label="فحوصات اليوم" value={stats.today} color="pink" />
      </div>

      <div id="lab-tests-print-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((test) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={test.id}
              className="glass p-8 rounded-[40px] relative group border border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -translate-x-12 -translate-y-12" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <FlaskConical size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{test.patientName}</h3>
                    <p className="text-[10px] text-indigo-400 font-black uppercase italic mt-1">{test.testType}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">ID: {test.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 no-print">
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => {
                          setEditingTest(test);
                          setShowAddModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(test.id)}
                        className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                   <span className={cn(
                     "px-3 py-1 rounded-xl text-[9px] font-black border uppercase tracking-wider italic",
                     test.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                   )}>
                     {test.status === 'pending' ? 'بانتظار النتيجة' : 'مكتمل النتيجة'}
                   </span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5 relative z-10 text-right">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-tighter">
                      <Beaker size={14} className="text-indigo-500/50" />
                      الطبيب المحول
                   </div>
                   <span className="text-white font-black text-[10px]">{doctors.find(d => d.id === test.doctorId)?.name || 'طبيب خارجي'}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-tighter">
                      <Clock size={14} className="text-indigo-500/50" />
                      تاريخ الطلب
                   </div>
                   <span className="text-white font-black text-[10px] font-mono italic">{test.date}</span>
                </div>

                {test.status === 'completed' && test.parameterResults && (
                  <div className="p-4 glass-card bg-emerald-500/5 rounded-3xl border border-emerald-500/10 shadow-inner mt-4">
                     <p className="text-[9px] text-emerald-400 font-black mb-3 italic flex items-center gap-2">
                        <TrendingUp size={12}/> نتائج الفاّراميترات المخبرية:
                     </p>
                     <div className="space-y-3">
                        {Object.entries(test.parameterResults).map(([paramId, value]) => {
                          const master = masterTests.find((m: any) => m.id === test.testId);
                          const param = master?.parameters?.find((p: any) => p.id === paramId);
                          return (
                            <div key={paramId} className="flex items-center justify-between text-[11px] group/res underline-offset-4 decoration-dotted decoration-emerald-500/30">
                               <span className="text-slate-400 font-bold">{param?.name || 'مؤشر قياس'}:</span>
                               <div className="flex items-center gap-2">
                                  <span className="text-white font-black group-hover/res:text-emerald-400 transition-colors">{value}</span>
                                  <span className="text-slate-500 font-mono italic text-[9px]">{param?.unit}</span>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 no-print">
                   {test.status === 'pending' ? (
                     <button 
                      onClick={() => {
                        const master = masterTests.find((m: any) => m.id === test.testId);
                        if (master) {
                          setShowResultModal(test);
                          setResultParams({});
                        }
                      }}
                      className="flex-1 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-inner"
                     >
                        إدخال النتائج الطوربة
                     </button>
                   ) : (
                     <button 
                      onClick={() => printReport(`نتيجة فحص ${test.testType} - ${test.patientName}`, test.id)}
                      className="flex-1 py-3 glass bg-white/5 text-slate-500 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-sm"
                     >
                        طباعة كرت النتيجة
                     </button>
                   )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[40px] border-2 border-dashed border-white/5 opacity-50">
            <FlaskConical size={48} className="mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-600 tracking-widest uppercase">لا توجد طلبات فحص في النظام حالياً</p>
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
              className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white border-r-4 border-indigo-500 pr-5">
                   {editingTest ? 'تعديل طلب الفحص' : 'إنشاء طلب فحص مخبري جديد'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-6">
                <div className="space-y-2 text-right">
                   <label className="text-[10px] font-black text-slate-500 uppercase italic">حدد المريض</label>
                   <select name="patientId" required defaultValue={editingTest?.patientId} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                     {patients.map((p, idx) => <option key={`${p.id}-${idx}`} value={p.id} className="bg-slate-900">{p.name}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2 text-right">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">نوع الفحص المطلوب</label>
                      <select name="testId" required defaultValue={editingTest?.testId} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold text-right font-black">
                        {masterTests.map((m, idx) => <option key={`${m.id}-${idx}`} value={m.id} className="bg-slate-900">{m.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 text-right">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">الطبيب المحيل</label>
                      <select name="doctorId" required defaultValue={editingTest?.doctorId} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                        {doctors.map((d, idx) => <option key={`${d.id}-${idx}`} value={d.id} className="bg-slate-900 font-black italic underline text-sky-400">د. {d.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-2 text-right">
                   <label className="text-[10px] font-black text-slate-500 uppercase italic">تاريخ الطلب</label>
                   <input name="date" type="date" required defaultValue={editingTest?.date || new Date().toISOString().split('T')[0]} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold font-mono" />
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all uppercase tracking-[4px]">
                     {editingTest ? 'تحديث الطلب' : 'تأكيد الطلب'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-[4px]">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showResultModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResultModal(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, y: 30, opacity: 0 }} 
               animate={{ scale: 1, y: 0, opacity: 1 }} 
               exit={{ scale: 0.9, y: 30, opacity: 0 }} 
               className="relative w-full max-w-xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-hidden shadow-2xl"
            >
               <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-emerald-500 pr-5">إدخال النتائج: {showResultModal.testType}</h3>
               <div className="space-y-6">
                  {masterTests.find(m => m.id === showResultModal.testId)?.parameters?.map(param => (
                    <div key={param.id} className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase italic flex justify-between">
                          <span>نطاق الطبيعي: {param.normalRange} {param.unit}</span>
                          <span>{param.name}</span>
                       </label>
                       <div className="relative">
                          <input 
                            type="text" 
                            className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold font-mono focus:border-emerald-500 transition-all"
                            placeholder={`أدخل القيمة (${param.unit})...`}
                            onChange={(e) => setResultParams(prev => ({ ...prev, [param.id]: e.target.value }))}
                          />
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">{param.unit}</span>
                       </div>
                    </div>
                  ))}
                  
                  <div className="pt-8 flex gap-4">
                     <button 
                      onClick={() => updateResults(showResultModal.id)}
                      className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all uppercase tracking-[4px]"
                     >
                        اعتماد النتيجة النهائية
                     </button>
                     <button onClick={() => setShowResultModal(null)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-[4px]">إلغاء</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  };

  return (
    <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
