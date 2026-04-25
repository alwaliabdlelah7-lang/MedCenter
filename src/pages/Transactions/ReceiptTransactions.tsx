import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Receipt, 
  User, 
  Stethoscope, 
  Activity as ActivityIcon, 
  CreditCard, 
  Printer, 
  Trash2, 
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  BarChart3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType, Doctor, Service, Patient } from '../../types';
import { dataStore } from '../../services/dataService';
import { exportToCSV, printReport } from '../../lib/exportUtils';
import { cn } from '../../lib/utils';

export default function ReceiptTransactions() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [receiptsData, doctorsData, servicesData, patientsData] = await Promise.all([
          dataStore.getAll<ReceiptType>('receipts'),
          dataStore.getAll<Doctor>('doctors'),
          dataStore.getAll<Service>('services'),
          dataStore.getAll<Patient>('patients')
        ]);
        setReceipts(receiptsData);
        setDoctors(doctorsData);
        setServices(servicesData);
        setPatients(patientsData);
      } catch (error) {
        console.error("Failed to load receipts data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReceipt, setNewReceipt] = useState<Partial<ReceiptType>>({
    patientId: '',
    patientName: '',
    patientAge: 25,
    serviceId: '',
    doctorId: '',
    paymentMethod: 'cash',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceipt.patientId || !newReceipt.serviceId || !newReceipt.doctorId) return;
    
    const service = services.find(s => s.id === newReceipt.serviceId);
    const patient = patients.find(p => p.id === newReceipt.patientId);
    
    const receipt: ReceiptType = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      patientId: newReceipt.patientId!,
      patientName: patient?.name || 'Unknown',
      patientAge: patient?.age || newReceipt.patientAge || 25,
      serviceId: newReceipt.serviceId!,
      doctorId: newReceipt.doctorId!,
      amount: service?.price || 0,
      paymentMethod: newReceipt.paymentMethod as 'cash' | 'credit',
      date: new Date().toLocaleDateString('ar-YE'),
      status: 'paid'
    };
    
    await dataStore.addItem('receipts', receipt);
    
    // INTEGRATION: If the service is a consultation/visit, add to clinical queue
    const isClinicalService = service?.name.includes('معاينة') || service?.name.includes('كشف') || service?.id.includes('consult');
    if (isClinicalService && receipt.doctorId) {
      const doctor = doctors.find(d => d.id === receipt.doctorId);
      const queueEntry = {
        id: `Q-${Date.now().toString().slice(-6)}`,
        patientId: receipt.patientId,
        patientName: receipt.patientName,
        doctorId: receipt.doctorId,
        clinicId: `c-${doctor?.departmentId?.split('-')[1] || '1'}`, // Heuristic clinic link
        visitType: 'consultation',
        status: 'waiting',
        checkInTime: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        priority: 1
      };
      await dataStore.addItem('queues', queueEntry);
    }

    setReceipts([receipt, ...receipts]);
    setShowAddModal(false);
    setNewReceipt({ patientId: '', patientName: '', patientAge: 25, serviceId: '', doctorId: '', paymentMethod: 'cash' });
  };

  const handlePrint = (receipt: ReceiptType) => {
    const doctor = doctors.find(d => d.id === receipt.doctorId);
    const service = services.find(s => s.id === receipt.serviceId);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سند استعلامات - ${receipt.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; }
            .total { font-size: 24px; font-weight: bold; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مستشفى إبداع التخصصي</h1>
            <p>سند استعلامات طبي رقم ${receipt.id}</p>
          </div>
          <div class="info-grid">
            <div><span class="label">اسم المريض:</span> ${receipt.patientName}</div>
            <div><span class="label">التاريخ:</span> ${receipt.date}</div>
            <div><span class="label">المعرف:</span> ${receipt.patientId}</div>
            <div><span class="label">العمر:</span> ${receipt.patientAge}</div>
            <div><span class="label">الخدمة:</span> ${service?.name}</div>
            <div><span class="label">الطبيب:</span> ${doctor?.name}</div>
          </div>
          <div class="total">الإجمالي: ${receipt.amount.toLocaleString()} ر.ي</div>
          <div class="footer">شكراً لزيارتكم - نتمنى لكم الشفاء العاجل</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const data = filteredReceipts.map(r => ({
      'رقم السند': r.id,
      'المريض': r.patientName,
      'الخدمة': services.find(s => s.id === r.serviceId)?.name || 'غير محدد',
      'الطبيب': doctors.find(d => d.id === r.doctorId)?.name || 'غير محدد',
      'المبلغ': r.amount,
      'التاريخ': r.date,
      'طريقة الدفع': r.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة / تأمين'
    }));
    exportToCSV(data, 'receipts_report');
  };

  const stats = {
    total: receipts.length,
    today: receipts.filter(r => r.date === new Date().toLocaleDateString('ar-YE')).length,
    volume: receipts.reduce((acc, r) => acc + r.amount, 0),
    avg: receipts.length > 0 ? Math.round(receipts.reduce((acc, r) => acc + r.amount, 0) / receipts.length) : 0
  };

  const filteredReceipts = receipts.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">سندات القبض والاستعلامات</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">إدارة التدفقات المالية والخدمات الطبية المقدمة</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث برقم السند أو المريض..." 
              className="pr-10 pl-4 py-2.5 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-400 outline-none w-64 transition-all font-bold font-mono tracking-tighter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg"
            title="تصدير التقارير المالية"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => printReport('تقرير سندات المراجعين', 'receipts-list-print')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg"
            title="طباعة التقرير"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2.5 rounded-xl font-black shadow-xl shadow-sky-600/20 hover:bg-sky-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
          >
            <Plus size={18} />
            <span>إصدار سند جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
         <MiniStat icon={Receipt} label="إجمالي السندات" value={stats.total} color="sky" />
         <MiniStat icon={TrendingUp} label="سندات اليوم" value={stats.today} color="emerald" />
         <MiniStat icon={DollarSign} label="إجمالي الإيرادات" value={`${stats.volume.toLocaleString()} ر.ي`} color="amber" />
         <MiniStat icon={BarChart3} label="متوسط الفاتورة" value={`${stats.avg.toLocaleString()} ر.ي`} color="indigo" />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
        <div id="receipts-list-print" className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[3px]">
              <tr>
                <th className="px-8 py-6 border-b border-white/5">رقم السند</th>
                <th className="px-8 py-6 border-b border-white/5">المراجع</th>
                <th className="px-8 py-6 border-b border-white/5">الخدمة / الأخصائي</th>
                <th className="px-8 py-6 border-b border-white/5">المبلغ</th>
                <th className="px-8 py-6 border-b border-white/5">التاريخ</th>
                <th className="px-8 py-6 border-b border-white/5 text-center no-print">أدوات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 italic">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-black text-slate-400 text-xs font-mono tracking-tighter">#{receipt.id}</td>
                  <td className="px-8 py-5">
                    <div className="font-black text-white group-hover:text-sky-400 transition-colors">{receipt.patientName}</div>
                    <div className="text-[10px] text-slate-500 font-mono italic">UID: {receipt.patientId}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-indigo-400 uppercase italic tracking-tighter">{services.find(s => s.id === receipt.serviceId)?.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold">د. {doctors.find(d => d.id === receipt.doctorId)?.name}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-emerald-400 font-black font-mono bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
                      {receipt.amount.toLocaleString()} <small className="text-[10px] text-slate-500">ر.ي</small>
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs font-mono">{receipt.date}</td>
                  <td className="px-8 py-5 no-print">
                     <div className="flex gap-2 justify-center">
                       <button 
                        onClick={() => handlePrint(receipt)} 
                        className="p-2.5 glass bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all shadow-lg"
                        title="طباعة السند"
                       >
                          <Printer size={16} />
                       </button>
                       <button 
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا السند؟')) {
                            dataStore.deleteItem('receipts', receipt.id).then(() => setReceipts(receipts.filter(r => r.id !== receipt.id)));
                          }
                        }} 
                        className="p-2.5 glass bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                        title="حذف السند"
                       >
                          <Trash2 size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReceipts.length === 0 && (
            <div className="py-24 text-center opacity-20 flex flex-col items-center">
               <Receipt size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-[10px]">لا توجد بيانات مالية</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl glass bg-[#0f172a]/95 rounded-[50px] p-12 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                <button onClick={() => setShowAddModal(false)} className="p-3 glass rounded-2xl text-slate-500 hover:text-white hover:bg-rose-500 transition-all"><X size={22} /></button>
                <h3 className="text-3xl font-black text-white border-r-8 border-sky-500 pr-6 tracking-tighter uppercase">إصدار سند مالي جديد</h3>
              </div>
              <form onSubmit={handleAdd} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                       Patient Identification
                    </label>
                    <select 
                      required 
                      className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all" 
                      value={newReceipt.patientId} 
                      onChange={(e) => {
                        const p = patients.find(p => p.id === e.target.value);
                        setNewReceipt({
                          ...newReceipt, 
                          patientId: e.target.value,
                          patientName: p?.name || '',
                          patientAge: p?.age || 25
                        });
                      }}
                    >
                      <option className="bg-slate-900" value="">Choose Patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name} - #{p.id}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Patient Name (Editable)</label>
                    <input 
                      type="text"
                      required
                      className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all"
                      value={newReceipt.patientName}
                      onChange={(e) => setNewReceipt({...newReceipt, patientName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Patient Age</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold font-mono transition-all"
                      value={newReceipt.patientAge}
                      onChange={(e) => setNewReceipt({...newReceipt, patientAge: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Service Selection</label>
                    <select required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all" value={newReceipt.serviceId} onChange={(e) => setNewReceipt({...newReceipt, serviceId: e.target.value})}>
                      <option className="bg-slate-900" value="">Select Service...</option>
                      {services.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name} ({s.price} ر.ي)</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                       Attending Physician
                    </label>
                    <select required className="w-full px-6 py-5 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold transition-all" value={newReceipt.doctorId} onChange={(e) => setNewReceipt({...newReceipt, doctorId: e.target.value})}>
                      <option className="bg-slate-900" value="">Select Doctor...</option>
                      {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Payment Gateway</label>
                    <div className="flex gap-4">
                       {['cash', 'credit'].map(method => (
                         <button
                           key={method}
                           type="button"
                           onClick={() => setNewReceipt({...newReceipt, paymentMethod: method as any})}
                           className={`flex-1 py-5 rounded-2xl font-black border-2 transition-all text-[10px] uppercase tracking-widest ${newReceipt.paymentMethod === method ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-lg shadow-sky-500/10' : 'glass bg-white/5 border-white/10 text-slate-500'}`}
                         >
                           {method === 'cash' ? 'Cash Basis' : 'Insurance / Credit'}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-12">
                  <button type="submit" className="flex-1 bg-sky-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-widest text-xs">Execute Transaction</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-6 glass bg-white/5 text-slate-500 rounded-[30px] font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Terminate</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
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
