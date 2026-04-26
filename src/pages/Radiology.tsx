import React, { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, FileText, Trash2, Camera, User, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RadiologyScan, Doctor, Patient } from '../types';
import { dataStore } from '../services/dataService';

export default function Radiology() {
  const [scans, setScans] = useState<RadiologyScan[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scansData, doctorsData, patientsData] = await Promise.all([
          dataStore.getAll<RadiologyScan>('radiology_scans'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Patient>('patients')
        ]);
        setScans(scansData);
        setDoctors(doctorsData);
        setPatients(patientsData);
      } catch (error) {
        console.error("Failed to load radiology data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newScan, setNewScan] = useState<Partial<RadiologyScan>>({
    patientId: '',
    patientName: '',
    scanType: 'أشعة سينية (X-Ray)',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScan.patientId) return;
    
    const patient = patients.find(p => p.id === newScan.patientId);
    
    const scan: RadiologyScan = {
      id: `RAD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: newScan.patientId!,
      patientName: patient?.name || 'Unknown',
      scanType: newScan.scanType!,
      doctorId: newScan.doctorId || doctors[0]?.id || '',
      date: newScan.date!,
      status: 'pending'
    };
    
    await dataStore.addItem('radiology_scans', scan);
    setScans([...scans, scan]);
    setShowAddModal(false);
    setNewScan({ ...newScan, patientId: '', patientName: '' });
  };

  const completeScan = async (id: string, report: string) => {
    const updates = { 
      status: 'completed' as const, 
      report, 
      imageUrl: `https://picsum.photos/seed/${id}/400/300?grayscale` 
    };
    await dataStore.updateItem<RadiologyScan>('radiology_scans', id, updates);
    setScans(scans.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    await dataStore.deleteItem('radiology_scans', id);
    setScans(scans.filter(s => s.id !== id));
  };

  const filtered = scans.filter(s => 
    s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.scanType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">الأشعة والتصوير الطبي</h2>
          <p className="text-sm text-sky-300/70 italic border-r-2 border-sky-500 pr-2 font-medium">إدارة فحوصات الأشعة، التقارير الصورية، والتشخيص الإشعاعي</p>
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
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>طلب أشعة جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length > 0 ? (
          filtered.map((scan, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={`${scan.id}-${idx}`}
              className="glass rounded-3xl overflow-hidden group border border-white/10 flex flex-col shadow-xl"
            >
              <div className="aspect-video bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
                 {scan.status === 'completed' && scan.imageUrl ? (
                   <div className="relative w-full h-full">
                     <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover rounded-xl border border-white/10 opacity-70 group-hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                   </div>
                 ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-700">
                      <Camera size={64} className="animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic tracking-tighter">بالانتظار للتصوير</span>
                    </div>
                 )}
                 <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                      scan.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {scan.status === 'pending' ? 'تحت الإجراء' : 'تم التشخيص'}
                    </span>
                 </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                   <h3 className="font-bold text-lg text-white mb-1">{scan.patientName}</h3>
                   <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wide">
                     <ImageIcon size={14} />
                     {scan.scanType}
                   </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                   <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-sky-500/50" />
                        بتحويل: {doctors.find(d => d.id === scan.doctorId)?.name || 'طبيب الطوارئ'}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <Clock size={12} className="text-sky-500/50" />
                        {scan.date}
                      </div>
                   </div>

                   {scan.status === 'completed' && scan.report && (
                     <div className="mt-4 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase italic border-b border-white/5 pb-1">تقرير الأشعة التشخيصي:</p>
                        <p className="text-slate-100 text-xs leading-relaxed italic line-clamp-3">{scan.report}</p>
                     </div>
                   )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                   {scan.status === 'pending' ? (
                     <button 
                      onClick={() => {
                        const report = prompt('أدخل التقرير التشخيصي للأشعة:');
                        if (report) completeScan(scan.id, report);
                      }}
                      className="px-6 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 shadow-lg shadow-sky-600/20 active:scale-95 transition-all uppercase tracking-widest"
                     >
                       إصدار النتيجة
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                       <CheckCircle2 size={16} />
                       جاهز للتسليم
                     </div>
                   )}
                   <button 
                    onClick={() => handleDelete(scan.id)}
                    className="p-2 text-slate-700 hover:text-rose-500 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-[40px] glass bg-white/5">
            <ImageIcon size={64} className="mb-4 opacity-10" />
            <p className="font-bold opacity-30 uppercase tracking-[5px] text-xs">No Imaging Requests</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass bg-slate-900/90 rounded-[40px] p-10 border border-white/10 shadow-2xl">
               <h3 className="text-xl font-bold mb-8 text-white text-right border-r-4 border-sky-500 pr-4 italic">طلب تصوير إشعاعي جديد</h3>
               <form onSubmit={handleAdd} className="space-y-6 text-right">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">اختيار مريض من النظام</label>
                    <select 
                      required 
                      className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold" 
                      value={newScan.patientId} 
                      onChange={(e) => setNewScan({...newScan, patientId: e.target.value})}
                    >
                      <option value="" className="bg-slate-900 text-slate-500">-- اختر مريض --</option>
                      {patients.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name} - #{p.id}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">نوع التصوير المطلوب</label>
                    <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold italic" value={newScan.scanType} onChange={(e) => setNewScan({...newScan, scanType: e.target.value})}>
                      <option className="bg-slate-900">أشعة سينية (X-Ray)</option>
                      <option className="bg-slate-900">أشعة مقطعية (CT Scan)</option>
                      <option className="bg-slate-900">رنين مغناطيسي (MRI)</option>
                      <option className="bg-slate-900">أشعة تلفزيونية (Ultrasound)</option>
                      <option className="bg-slate-900">بانتوراما أسنان</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">الطبيب المحول</label>
                      <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold" value={newScan.doctorId} onChange={(e) => setNewScan({...newScan, doctorId: e.target.value})}>
                        {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">تاريخ الفحص</label>
                      <input type="date" className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold" value={newScan.date} onChange={(e) => setNewScan({...newScan, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-10">
                   <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-widest text-xs">إرسال الطلب</button>
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-500 py-5 rounded-3xl font-bold hover:bg-white/10 transition-colors">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
