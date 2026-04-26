import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Receipt, User, Stethoscope, Activity as ActivityIcon, CreditCard, Printer, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType, Doctor, Service, Patient } from '../../types';
import { dataStore } from '../../services/dataService';

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

  const filteredReceipts = receipts.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">سندات الاستعلامات</h2>
          <p className="text-sm text-slate-500">تسجيل زيارات المرضى والخدمات المقدمة والتحصيل المالي</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث برقم السند أو المريض..." 
              className="pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl outline-none w-64 focus:ring-4 focus:ring-sky-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>سند جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4 font-bold">رقم السند</th>
              <th className="px-8 py-4 font-bold">المريض</th>
              <th className="px-8 py-4 font-bold">الخدمة / الدكتور</th>
              <th className="px-8 py-4 font-bold">المبلغ</th>
              <th className="px-8 py-4 font-bold">التاريخ</th>
              <th className="px-8 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic">
            {filteredReceipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-400 text-xs font-mono">#{receipt.id}</td>
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{receipt.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">UID: {receipt.patientId}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-xs font-black text-sky-600 uppercase italic tracking-tighter">{services.find(s => s.id === receipt.serviceId)?.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold">د. {doctors.find(d => d.id === receipt.doctorId)?.name}</div>
                </td>
                <td className="px-8 py-5 font-black text-slate-800 font-mono">{receipt.amount.toLocaleString()} <small className="text-[10px] text-slate-400">ر.ي</small></td>
                <td className="px-8 py-5 text-slate-500 text-xs font-mono">{receipt.date}</td>
                <td className="px-8 py-5">
                   <div className="flex gap-2 justify-center">
                     <button onClick={() => handlePrint(receipt)} className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-500 hover:text-white transition-all">
                        <Printer size={16} />
                     </button>
                     <button onClick={() => dataStore.deleteItem('receipts', receipt.id).then(() => setReceipts(receipts.filter(r => r.id !== receipt.id)))} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReceipts.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic">لا توجد سجلات مالية مطابقة</div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-12 border border-white/10">
              <h3 className="text-2xl font-black mb-10 text-slate-900 border-r-8 border-sky-500 pr-6 uppercase tracking-tighter">Issue New Financial Receipt</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                       Patient Identification
                    </label>
                    <select 
                      required 
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold" 
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
                      <option value="">Choose Patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} - #{p.id}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Patient Name (Editable)</label>
                    <input 
                      type="text"
                      required
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold"
                      value={newReceipt.patientName}
                      onChange={(e) => setNewReceipt({...newReceipt, patientName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Patient Age</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold font-mono"
                      value={newReceipt.patientAge || ''}
                      onChange={(e) => setNewReceipt({...newReceipt, patientAge: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Service Selection</label>
                    <select required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold" value={newReceipt.serviceId} onChange={(e) => setNewReceipt({...newReceipt, serviceId: e.target.value})}>
                      <option value="">Select Service...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} ر.ي)</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                       Attending Physician
                    </label>
                    <select required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 font-bold" value={newReceipt.doctorId} onChange={(e) => setNewReceipt({...newReceipt, doctorId: e.target.value})}>
                      <option value="">Select Doctor...</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Payment Gateway</label>
                    <div className="flex gap-4">
                       {['cash', 'credit'].map(method => (
                         <button
                           key={method}
                           type="button"
                           onClick={() => setNewReceipt({...newReceipt, paymentMethod: method as any})}
                           className={`flex-1 py-5 rounded-2xl font-black border-2 transition-all text-[10px] uppercase tracking-widest ${newReceipt.paymentMethod === method ? 'bg-sky-50 border-sky-500 text-sky-600 shadow-lg shadow-sky-500/10' : 'bg-slate-50 border-transparent text-slate-400'}`}
                         >
                           {method === 'cash' ? 'Cash Basis' : 'Insurance / Credit'}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-10">
                  <button type="submit" className="flex-1 bg-sky-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all uppercase tracking-widest text-xs">Execute Transaction</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Terminate</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
