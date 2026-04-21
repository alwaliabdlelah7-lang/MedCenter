import React, { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, FileText, Trash2, Camera, User, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RadiologyScan, Doctor } from '../types';

export default function Radiology() {
  const [scans, setScans] = useState<RadiologyScan[]>(() => {
    const saved = localStorage.getItem('hospital_radiology_scans');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newScan, setNewScan] = useState<Partial<RadiologyScan>>({
    patientName: '',
    scanType: 'أشعة سينية (X-Ray)',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  useEffect(() => {
    localStorage.setItem('hospital_radiology_scans', JSON.stringify(scans));
  }, [scans]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScan.patientName) return;
    
    const scan: RadiologyScan = {
      id: `RAD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientName: newScan.patientName!,
      scanType: newScan.scanType!,
      doctorId: newScan.doctorId || doctors[0]?.id || '',
      date: newScan.date!,
      status: 'pending'
    };
    
    setScans([...scans, scan]);
    setShowAddModal(false);
    setNewScan({ ...newScan, patientName: '' });
  };

  const completeScan = (id: string, report: string) => {
    setScans(scans.map(s => s.id === id ? { ...s, status: 'completed', report, imageUrl: `https://picsum.photos/seed/${id}/400/300?grayscale` } : s));
  };

  const filtered = scans.filter(s => 
    s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.scanType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4">
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
          filtered.map((scan) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={scan.id}
              className="glass rounded-3xl overflow-hidden group border border-white/10 flex flex-col"
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
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">في انتظار التصوير</span>
                    </div>
                 )}
                 <div className="absolute top-4 left-4">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${
                     scan.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
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
                        بتحويل من: {doctors.find(d => d.id === scan.doctorId)?.name || 'طبيب الطوارئ'}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <Clock size={12} className="text-sky-500/50" />
                        {scan.date}
                      </div>
                   </div>

                   {scan.status === 'completed' && scan.report && (
                     <div className="mt-4 p-4 glass-card bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase italic">تقرير الأشعة:</p>
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
                      className="px-6 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
                     >
                       إصدار النتيجة والتقرير
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                       <CheckCircle2 size={16} />
                       التشخيص مكتمل
                     </div>
                   )}
                   <button 
                    onClick={() => setScans(scans.filter(s => s.id !== scan.id))}
                    className="p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-white/10 rounded-3xl glass bg-white/5">
            <ImageIcon size={48} className="mb-4 opacity-10" />
            <p className="font-medium text-slate-300 italic">لا توجد طلبات أشعة حالياً</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass bg-slate-900/90 rounded-3xl p-8 border border-white/10">
               <h3 className="text-xl font-bold mb-6 text-white text-right border-r-4 border-sky-500 pr-4">طلب تصوير إشعاعي جديد</h3>
               <form onSubmit={handleAdd} className="space-y-4 text-right">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">اسم المريض</label>
                    <input required className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 direction-rtl font-bold" value={newScan.patientName} onChange={(e) => setNewScan({...newScan, patientName: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">نوع التصوير</label>
                    <select className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold" value={newScan.scanType} onChange={(e) => setNewScan({...newScan, scanType: e.target.value})}>
                      <option className="bg-slate-900">أشعة سينية (X-Ray)</option>
                      <option className="bg-slate-900">أشعة مقطعية (CT Scan)</option>
                      <option className="bg-slate-900">رنين مغناطيسي (MRI)</option>
                      <option className="bg-slate-900">أشعة تلفزيونية (Ultrasound)</option>
                      <option className="bg-slate-900">بانتوراما أسنان</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">الطبيب المحول</label>
                      <select className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold" value={newScan.doctorId} onChange={(e) => setNewScan({...newScan, doctorId: e.target.value})}>
                        {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 italic block">تاريخ الفحص</label>
                      <input type="date" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold" value={newScan.date} onChange={(e) => setNewScan({...newScan, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                   <button type="submit" className="flex-1 py-4 bg-sky-600 text-white rounded-2xl font-bold shadow-xl shadow-sky-600/20 hover:bg-sky-500 active:scale-95 transition-all">إرسال الطلب للمركز</button>
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass bg-white/5 text-slate-400 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
