import React, { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical, Beaker, FileText, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LabTest, Doctor } from '../types';
import { YEMEN_LAB_TESTS } from '../data/seedData';

export default function Laboratory() {
  const [tests, setTests] = useState<LabTest[]>(() => {
    const saved = localStorage.getItem('hospital_lab_tests');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  const [masterTests] = useState(() => {
    const saved = localStorage.getItem('hospital_master_lab_tests');
    return saved ? JSON.parse(saved) : YEMEN_LAB_TESTS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<LabTest | null>(null);
  const [resultParams, setResultParams] = useState<Record<string, string>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newTest, setNewTest] = useState<Partial<LabTest>>({
    patientName: '',
    testType: masterTests[0]?.name || '',
    testId: masterTests[0]?.id || '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  useEffect(() => {
    localStorage.setItem('hospital_lab_tests', JSON.stringify(tests));
  }, [tests]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.patientName) return;
    
    const master = masterTests.find((m: any) => m.name === newTest.testType);
    
    const test: LabTest = {
      id: `LAB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientName: newTest.patientName!,
      testType: newTest.testType!,
      testId: master?.id,
      doctorId: newTest.doctorId || doctors[0]?.id || '',
      date: newTest.date!,
      status: 'pending'
    };
    
    setTests([...tests, test]);
    setShowAddModal(false);
    setNewTest({ ...newTest, patientName: '' });
  };

  const updateResults = (id: string) => {
    setTests(tests.map(t => t.id === id ? { ...t, status: 'completed', parameterResults: resultParams } : t));
    setShowResultModal(null);
    setResultParams({});
  };

  const filtered = tests.filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">المختبرات والتحاليل الطبية</h2>
          <p className="text-sm text-sky-300/70 italic border-r-2 border-sky-500 pr-2">إدارة طلبات الفحوصات المخبرية، وإدخال النتائج الطبية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم المريض أو الفحص..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>طلب فحص جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((test) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={test.id}
              className="glass p-6 rounded-3xl relative group border-t-4 border-indigo-500/20"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl glass bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FlaskConical size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{test.patientName}</h3>
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">{test.testType}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="text-[10px] text-slate-500 font-mono italic">#{test.id}</div>
                   <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${
                     test.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                   }`}>
                     {test.status === 'pending' ? 'قيد المعالجة' : 'تم استكمال النتيجة'}
                   </span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Beaker size={14} className="text-indigo-400" />
                      بواسطة: {doctors.find(d => d.id === test.doctorId)?.name || 'طبيب محول'}
                   </div>
                   <div className="flex items-center gap-2 text-slate-500 font-mono">
                      <Clock size={14} className="text-indigo-400" />
                      {test.date}
                   </div>
                </div>

                {test.status === 'completed' && test.parameterResults && (
                  <div className="p-4 glass-card bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                     <p className="text-[11px] text-emerald-300/80 font-black mb-3 uppercase tracking-tighter italic border-b border-emerald-500/10 pb-2">النتائج التفصيلية للفحص:</p>
                     <div className="space-y-3">
                        {Object.entries(test.parameterResults).map(([paramId, value]) => {
                          const master = masterTests.find((m: any) => m.id === test.testId);
                          const param = master?.parameters?.find((p: any) => p.id === paramId);
                          return (
                            <div key={paramId} className="flex items-center justify-between text-[11px]">
                               <span className="text-slate-400 font-bold">{param?.name || 'باراميتر'}:</span>
                               <div className="flex items-center gap-2">
                                  <span className="text-white font-black">{value}</span>
                                  <span className="text-slate-500 font-mono italic">{param?.unit}</span>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                   {test.status === 'pending' ? (
                     <button 
                      onClick={() => {
                        const master = masterTests.find((m: any) => m.id === test.testId);
                        if (master) {
                          setShowResultModal(test);
                          setResultParams({});
                        } else {
                          alert('لا يمكن العثور على هيكل الفحص في الدليل');
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-white hover:bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all shadow-lg shadow-indigo-500/5 hover:-translate-y-0.5 active:translate-y-0"
                     >
                       <FileText size={14} />
                       إدخال النتائج التفصيلية
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                       <CheckCircle size={16} />
                       جاهز للتسليم
                     </div>
                   )}
                   
                   <button 
                    onClick={() => setTests(tests.filter(t => t.id !== test.id))}
                    className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-white/10 rounded-3xl glass bg-white/5">
            <Beaker size={48} className="mb-4 opacity-10" />
            <p className="font-medium text-slate-300">لا توجد سجلات مخبرية متاحة</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass bg-slate-900/90 rounded-3xl p-8 border border-white/10">
               <h3 className="text-xl font-bold mb-6 text-white text-right border-r-4 border-indigo-500 pr-4">طلب فحص مخبري جديد</h3>
               <form onSubmit={handleAdd} className="space-y-4 text-right">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">اسم المريض</label>
                    <input required className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 direction-rtl" value={newTest.patientName} onChange={(e) => setNewTest({...newTest, patientName: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">نوع الفحص</label>
                    <select className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold" value={newTest.testType} onChange={(e) => setNewTest({...newTest, testType: e.target.value})}>
                      {masterTests.map((test: any) => (
                        <option key={test.id || test.name} value={test.name} className="bg-slate-900">
                          {test.name} - ({test.price} ر.ي)
                        </option>
                      ))}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">الطبيب المحول</label>
                      <select className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none" value={newTest.doctorId} onChange={(e) => setNewTest({...newTest, doctorId: e.target.value})}>
                        {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">تاريخ الطلب</label>
                      <input type="date" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold" value={newTest.date} onChange={(e) => setNewTest({...newTest, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                   <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">إرسال الطلب</button>
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-400 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
        {showResultModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResultModal(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass bg-slate-900/90 rounded-[40px] p-10 border border-white/10 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -translate-x-10 -translate-y-10" />
               <h3 className="text-2xl font-black mb-8 text-white text-right border-r-4 border-indigo-500 pr-5 tracking-tight italic">إدخال نتائج الفحص المخبري</h3>
               <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 text-right">
                  <div className="p-6 glass bg-white/5 rounded-3xl border border-white/5 mb-8">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">المريض</span>
                        <span className="text-sm font-black text-white">{showResultModal.patientName}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">الفحص</span>
                        <span className="text-sm font-black text-indigo-400 italic">{showResultModal.testType}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    {masterTests.find((m: any) => m.id === showResultModal.testId)?.parameters?.map((param: any) => (
                      <div key={param.id} className="grid grid-cols-2 gap-4 items-center p-4 glass bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-300">{param.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-1 italic">المجال الطبيعي: {param.normalRange} <span className="text-[8px] opacity-60 uppercase">{param.unit}</span></p>
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 font-black text-center"
                            placeholder="0.00"
                            value={resultParams[param.id] || ''}
                            onChange={(e) => setResultParams({...resultParams, [param.id]: e.target.value})}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono italic">{param.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4 pt-10">
                 <button 
                  onClick={() => updateResults(showResultModal.id)}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-[25px] font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all uppercase tracking-widest"
                 >
                   اعتماد وحفظ النتائج
                 </button>
                 <button 
                  onClick={() => setShowResultModal(null)}
                  className="px-10 glass bg-white/5 text-slate-400 py-5 rounded-[25px] font-bold hover:bg-white/10 transition-colors"
                 >
                   إلغاء
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
