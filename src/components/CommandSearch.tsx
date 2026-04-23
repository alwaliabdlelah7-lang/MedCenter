import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Stethoscope, 
  Calendar, 
  Pill, 
  FlaskConical, 
  ChevronRight,
  Command,
  FileText,
  Activity as ActivityIcon,
  History as HistoryIcon,
  CreditCard,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Patient, Doctor, Appointment, Receipt, LabTest, MasterMedicine } from '../types';
import { dataStore } from '../services/dataService';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'patient' | 'doctor' | 'page' | 'action' | 'appointment' | 'receipt' | 'lab' | 'medicine';
  path: string;
  icon: any;
}

export default function CommandSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [medicines, setMedicines] = useState<MasterMedicine[]>([]);

  const [recentSearches, setRecentSearches] = useState<SearchResult[]>(() => {
    const saved = localStorage.getItem('hospital_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  // Load all data when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadAllData = async () => {
        setIsLoading(true);
        try {
          const [pts, dcs, apts, rcts, labs, meds] = await Promise.all([
            dataStore.getAll<Patient>('patients'),
            dataStore.getAll<Doctor>('doctors'),
            dataStore.getAll<Appointment>('appointments'),
            dataStore.getAll<Receipt>('receipts'),
            dataStore.getAll<LabTest>('lab_tests'),
            dataStore.getAll<MasterMedicine>('master_medicines')
          ]);
          setPatients(pts);
          setDoctors(dcs);
          setAppointments(apts);
          setReceipts(rcts);
          setLabTests(labs);
          setMedicines(meds);
        } catch (err) {
          console.error("Failed to load search data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadAllData();
    }
  }, [isOpen]);

  const searchPages = useMemo(() => [
    { title: 'لوحة التحكم', path: '/', icon: ActivityIcon },
    { title: 'المواعيد والحجوزات', path: '/appointments', icon: Calendar },
    { title: 'إدارة المرضى', path: '/patients', icon: Users },
    { title: 'قائمة الانتظار', path: '/queue', icon: HistoryIcon },
    { title: 'الصيدلية', path: '/pharmacy', icon: Pill },
    { title: 'المختبرات', path: '/laboratory', icon: FlaskConical },
  ], []);

  const performSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const lowQuery = q.toLowerCase();

    const ptResults: SearchResult[] = patients
      .filter(p => p.name.toLowerCase().includes(lowQuery) || p.phone.includes(q))
      .map(p => ({
        id: p.id,
        title: p.name,
        description: `مريض • هاتف: ${p.phone} • العمر: ${p.age}`,
        type: 'patient',
        path: `/patients`,
        icon: Users
      }));

    const dctResults: SearchResult[] = doctors
      .filter(d => d.name.toLowerCase().includes(lowQuery) || d.specialization.toLowerCase().includes(lowQuery))
      .map(d => ({
        id: d.id,
        title: d.name,
        description: `طبيب • ${d.specialization}`,
        type: 'doctor',
        path: `/directories/doctors`,
        icon: Stethoscope
      }));

    const aptResults: SearchResult[] = appointments
      .filter(a => a.patientName.toLowerCase().includes(lowQuery) || a.id.toLowerCase().includes(lowQuery))
      .map(a => ({
        id: a.id,
        title: `موعد: ${a.patientName}`,
        description: `موعد • التاريخ: ${a.date} • الوقت: ${a.time}`,
        type: 'appointment',
        path: `/appointments`,
        icon: Calendar
      }));

    const rctResults: SearchResult[] = receipts
      .filter(r => r.patientName.toLowerCase().includes(lowQuery) || r.id.toLowerCase().includes(lowQuery))
      .map(r => ({
        id: r.id,
        title: `سند قبض: ${r.patientName}`,
        description: `سند • المبلغ: ${r.amount} • رقم: ${r.id}`,
        type: 'receipt',
        path: `/billing`,
        icon: CreditCard
      }));

    const labResultsList: SearchResult[] = labTests
      .filter(l => l.patientName.toLowerCase().includes(lowQuery) || l.testType.toLowerCase().includes(lowQuery))
      .map(l => ({
        id: l.id,
        title: `فحص: ${l.patientName}`,
        description: `مختبر • نوع الفحص: ${l.testType}`,
        type: 'lab',
        path: `/laboratory`,
        icon: FlaskConical
      }));

    const medResults: SearchResult[] = medicines
      .filter(m => m.tradeName.toLowerCase().includes(lowQuery) || m.scientificName.toLowerCase().includes(lowQuery))
      .map(m => ({
        id: m.id,
        title: m.tradeName,
        description: `دواء • الاسم العلمي: ${m.scientificName} • السعر: ${m.price}`,
        type: 'medicine',
        path: `/pharmacy`,
        icon: Pill
      }));

    const pgResults: SearchResult[] = searchPages
      .filter(p => p.title.toLowerCase().includes(lowQuery))
      .map(p => ({
        id: p.path,
        title: p.title,
        description: 'انتقال سريع إلى الصفحة',
        type: 'page',
        path: p.path,
        icon: p.icon
      }));

    const combinedResults = [
      ...pgResults, 
      ...ptResults, 
      ...dctResults, 
      ...aptResults, 
      ...rctResults, 
      ...labResultsList,
      ...medResults
    ];

    if (ptResults.length === 0 && lowQuery.length > 2) {
      combinedResults.unshift({
        id: 'action-add-patient',
        title: `إضافة مريض جديد: ${q}`,
        description: 'إنشاء سجل جديد وحجز موعد تلقائي',
        type: 'action',
        path: `/patients?add=true&name=${encodeURIComponent(q)}`,
        icon: Users
      } as any);
    }

    setResults(combinedResults.slice(0, 12));
    setSelectedIndex(0);
  }, [patients, doctors, appointments, receipts, labTests, medicines, searchPages]);

  useEffect(() => {
    if (isOpen) {
      performSearch(query);
    }
  }, [query, performSearch, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const currentListLength = query.trim() === '' ? recentSearches.length : results.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % currentListLength);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + currentListLength) % currentListLength);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const targetList = query.trim() === '' ? recentSearches : results;
        if (targetList[selectedIndex]) {
          handleSelect(targetList[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, recentSearches, selectedIndex, query, onClose]);

  const getIcon = (result: SearchResult) => {
    // If icon is a function/component (valid in memory)
    if (result.icon && typeof result.icon === 'function') {
      return result.icon;
    }
    
    // If it's an object but not empty (some components are objects)
    if (result.icon && typeof result.icon === 'object' && Object.keys(result.icon).length > 0) {
      return result.icon;
    }
    
    // Fallback to type mapping (for serialized results from localStorage)
    switch (result.type) {
      case 'patient': return Users;
      case 'doctor': return Stethoscope;
      case 'appointment': return Calendar;
      case 'receipt': return CreditCard;
      case 'lab': return FlaskConical;
      case 'medicine': return Pill;
      case 'page': return Command;
      default: return ActivityIcon;
    }
  };

  const handleSelect = (result: SearchResult) => {
    // Add to recent searches
    // We only store data that can be serialized
    const serializableResult = { ...result };
    
    const updatedRecent = [
      serializableResult,
      ...recentSearches.filter(r => r.id !== result.id)
    ].slice(0, 5);
    
    setRecentSearches(updatedRecent);
    localStorage.setItem('hospital_recent_searches', JSON.stringify(updatedRecent));
    
    navigate(result.path);
    onClose();
    setTimeout(() => setQuery(''), 300); // Clear after fade out
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 md:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <Search className="text-sky-400 shrink-0" size={24} />
              )}
              <input
                autoFocus
                type="text"
                placeholder="ابحث عن مريض، طبيب، موعد، أو دواء..."
                className="w-full bg-transparent border-none outline-none text-xl text-white placeholder:text-slate-600 font-medium text-right"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                onClick={onClose}
                className="p-2 glass bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar text-right">
              {query.trim() === '' ? (
                <div className="p-4 space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4 pr-4 italic">عمليات البحث الأخيرة</h4>
                      <div className="space-y-1">
                        {recentSearches.map((result, idx) => (
                          <button
                            key={result.id + idx}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-2xl transition-all text-right group border-2",
                              selectedIndex === idx 
                                ? "bg-sky-600/20 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.2)] scale-[1.01]" 
                                : "hover:bg-white/5 border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                             <div className="flex items-center gap-1 opacity-40">
                               <kbd className="px-1.5 py-0.5 glass bg-white/10 rounded border border-white/20 text-[8px] font-mono">ENTER</kbd>
                             </div>
                             <div className="flex items-center gap-3 flex-1 justify-end">
                               <div className="text-right">
                                 <h4 className="font-bold text-sm text-slate-200">{result.title}</h4>
                                 <p className="text-[9px] text-slate-500">{result.description}</p>
                               </div>
                               <div className="w-8 h-8 rounded-lg glass bg-white/5 flex items-center justify-center text-sky-400">
                                 {React.createElement(getIcon(result), { size: 16 })}
                               </div>
                             </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 glass bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
                      <Command size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">استخدم شريط البحث للوصول السريع لبيانات المستشفى</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                      {['المواعيد', 'الصيدلية', 'المختبر', 'المرضى'].map(tag => (
                        <span key={tag} className="px-3 py-1 glass bg-white/5 rounded-full text-[10px] text-slate-500 font-bold">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, idx) => (
                    <button
                      key={result.id + idx}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-right group mb-2 border-2",
                        selectedIndex === idx 
                          ? "bg-sky-600 shadow-2xl shadow-sky-600/40 border-white/30 scale-[1.02] -translate-x-1" 
                          : "hover:bg-white/5 border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <ChevronRight size={18} className={cn(
                        "transition-all",
                        selectedIndex === idx ? "text-white opacity-100" : "text-slate-800 opacity-0"
                      )} />
                      
                      <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="text-right">
                          <h4 className={cn(
                            "font-bold text-sm",
                            selectedIndex === idx ? "text-white" : "text-slate-200"
                          )}>{result.title}</h4>
                          <p className={cn(
                            "text-[10px] mt-0.5 font-medium",
                            selectedIndex === idx ? "text-sky-100/70" : "text-slate-500"
                          )}>{result.description}</p>
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          selectedIndex === idx ? "bg-white/20 text-white" : "glass bg-white/5 text-sky-400"
                        )}>
                          {React.createElement(getIcon(result), { size: 20 })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center space-y-6">
                  <div className="relative inline-block">
                    <Search size={48} className="text-slate-700 opacity-20" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-4 border-[#0f172a]" />
                  </div>
                  <p className="text-slate-500 font-black italic tracking-[5px] uppercase">No Results Found</p>
                  <p className="text-xs text-slate-600 font-medium">لم نتمكن من العثور على أي نتائج مطابقة لـ "{query}"</p>
                </div>
              )}
            </div>

            <div className="p-4 glass bg-white/5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 glass bg-white/10 rounded border border-white/20 text-[9px]">ENTER</kbd> للاختيار</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 glass bg-white/10 rounded border border-white/20 text-[9px]">↑↓</kbd> للتنقل</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-sky-400 font-black italic border-r-2 border-sky-500/30 pr-2">مركز إبداع الطبي</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
