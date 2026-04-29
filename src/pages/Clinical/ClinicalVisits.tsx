import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download, 
  Printer, 
  User, 
  Calendar, 
  Stethoscope,
  Activity as ActivityIcon,
  Filter,
  Eye,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClinicalVisit, Doctor, Patient } from '../../types';
import { cn } from '../../lib/utils';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';

export default function ClinicalVisits() {
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<ClinicalVisit | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [visitsData, doctorsData, patientsData] = await Promise.all([
          dataStore.getAll<ClinicalVisit>('clinical_visits'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Patient>('patients')
        ]);
        setVisits(visitsData);
        setDoctors(doctorsData);
        setPatients(patientsData);
      } catch (error) {
        console.error("Failed to load clinical visits", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredVisits = visits.filter(v => 
    v.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const data = filteredVisits.map(v => ({
      'المعرف': v.id,
      'المريض': v.patientName,
      'الطبيب': doctors.find(d => d.id === v.doctorId)?.name || 'غير محدد',
      'التشخيص': v.diagnosis,
      'التاريخ': new Date(v.date).toLocaleDateString('ar-YE'),
    }));
    exportToCSV(data, 'clinical_visits_archive');
  };

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-end gap-3">
             سجل الزيارات والتقارير الطبية
          </h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">أرشيف شامل لكل الزيارات السريرية، التشخيصات، والخطط العلاجية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالمريض، التشخيص، أو المعرف..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 lg:w-80 transition-all font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
            title="تصدير بيانات"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('سجل الزيارات السريرية', 'clinical-visits-table')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
            title="طباعة التقرير"
          >
            <Printer size={20} />
          </button>

          <button className="flex items-center gap-2 bg-white/5 text-slate-400 border border-white/10 px-5 py-2.5 rounded-xl font-bold hover:bg-white/10 transition-all">
            <Filter size={20} />
            <span>تصفية إضافية</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl" id="clinical-visits-table">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-black italic">
                  <th className="px-8 py-6 font-bold border-b border-white/5">المعرف</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5">المريض</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5">الطبيب المعالج</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5">التشخيص النهائي</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5">المؤشرات (Vitals)</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5 text-center">التاريخ</th>
                  <th className="px-8 py-6 font-bold border-b border-white/5 no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {filteredVisits.map((visit) => {
                  const doc = doctors.find(d => d.id === visit.doctorId);
                  return (
                    <tr key={visit.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">#{visit.id}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                             <User size={18} />
                          </div>
                          <span className="font-black group-hover:text-sky-400 transition-colors">{visit.patientName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Stethoscope size={14} className="text-slate-500" />
                          <span className="text-xs font-bold">{doc?.name || '---'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-rose-400 bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10">{visit.diagnosis}</span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex gap-2">
                            <span className="text-[9px] font-mono text-slate-400">{visit.vitals.bp} mmHg</span>
                            <span className="text-[9px] font-mono text-slate-400">{visit.vitals.temp}°C</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500">{new Date(visit.date).toLocaleDateString('ar-YE')}</span>
                            <span className="text-[9px] text-slate-600 italic">{new Date(visit.date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 no-print">
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedVisit(visit)}
                              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-lg transition-all"
                            >
                               <Eye size={16} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-indigo-600 rounded-lg transition-all">
                               <FileText size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedVisit(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 30, opacity: 0 }} 
              className="relative w-full max-w-4xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-hidden shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                     <ClipboardList size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">تفاصيل الزيارة السريرية</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase mt-1 italic tracking-widest">{selectedVisit.patientName} • {new Date(selectedVisit.date).toLocaleDateString('ar-YE')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVisit(null)}
                  className="p-3 glass rounded-2xl text-slate-400 hover:text-white hover:bg-rose-500 transition-all font-black"
                >إغلاق</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 space-y-6">
                    <div className="space-y-3">
                       <h5 className="text-xs font-black text-sky-400 uppercase tracking-widest border-r-4 border-sky-500 pr-3">التشخيص الطبي (Diagnosis)</h5>
                       <div className="p-6 glass bg-white/5 border border-white/5 rounded-3xl text-white font-black leading-relaxed">
                          {selectedVisit.diagnosis}
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-r-4 border-emerald-400 pr-3">الخطة العلاجية والتوصيات (Plan)</h5>
                       <div className="p-6 glass bg-white/5 border border-white/5 rounded-3xl text-slate-300 font-medium leading-relaxed italic">
                          {selectedVisit.treatmentPlan}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="glass p-6 rounded-[35px] border border-white/5 space-y-4">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                          <ActivityIcon size={14} className="text-rose-500" /> Vital Signs
                       </h5>
                       <div className="space-y-3">
                          <VitalsRow label="BP" value={selectedVisit.vitals.bp} unit="mmHg" />
                          <VitalsRow label="HR" value={selectedVisit.vitals.hr} unit="bpm" />
                          <VitalsRow label="TEMP" value={selectedVisit.vitals.temp} unit="°C" />
                          <VitalsRow label="WT" value={selectedVisit.vitals.weight || '---'} unit="kg" />
                       </div>
                    </div>

                    <div className="glass p-6 rounded-[35px] border border-white/5 space-y-4">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-400" /> Encounter Data
                       </h5>
                       <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                             <span className="text-slate-500 font-bold">الطبيب:</span>
                             <span className="text-indigo-400 font-black">د. {doctors.find(d => d.id === selectedVisit.doctorId)?.name}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                             <span className="text-slate-500 font-bold">العيادة:</span>
                             <span className="text-white font-black capitalize">{selectedVisit.patientId ? 'Main Clinic' : 'Outpatient'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                 <button 
                  onClick={() => printReport(`تقرير طبي - ${selectedVisit.patientName}`, 'visit-details')}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all uppercase tracking-[2px]"
                 >طباعة التقرير الطبي</button>
                 <button className="flex-1 py-4 glass bg-white/5 text-slate-400 rounded-2xl font-black hover:bg-white/10 transition-all uppercase tracking-[2px]">مشاركة السجل (Email/Whats)</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VitalsRow({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="flex items-center justify-between group">
       <span className="text-[10px] font-black text-slate-500 group-hover:text-sky-400 transition-colors uppercase font-mono">{label}</span>
       <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-white">{value}</span>
          <span className="text-[8px] text-slate-600 font-bold uppercase">{unit}</span>
       </div>
    </div>
  );
}
