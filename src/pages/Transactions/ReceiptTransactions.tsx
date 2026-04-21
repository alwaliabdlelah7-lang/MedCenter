import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Receipt, User, Stethoscope, Activity as ActivityIcon, CreditCard, Printer, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt as ReceiptType, Doctor, Service } from '../../types';

export default function ReceiptTransactions() {
  const [receipts, setReceipts] = useState<ReceiptType[]>(() => {
    const saved = localStorage.getItem('hospital_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  const [services] = useState<Service[]>(() => {
    const saved = localStorage.getItem('hospital_services');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReceipt, setNewReceipt] = useState<Partial<ReceiptType>>({
    patientName: '',
    patientAge: 25,
    serviceId: '',
    doctorId: '',
    paymentMethod: 'cash',
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('hospital_receipts', JSON.stringify(receipts));
  }, [receipts]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceipt.patientName || !newReceipt.serviceId || !newReceipt.doctorId) return;
    
    const service = services.find(s => s.id === newReceipt.serviceId);
    
    const receipt: ReceiptType = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      patientName: newReceipt.patientName!,
      patientAge: newReceipt.patientAge!,
      serviceId: newReceipt.serviceId!,
      doctorId: newReceipt.doctorId!,
      amount: service?.price || 0,
      paymentMethod: newReceipt.paymentMethod as 'cash' | 'credit',
      date: new Date().toLocaleDateString('ar-YE'),
      status: 'paid'
    };
    
    setReceipts([receipt, ...receipts]);
    setShowAddModal(false);
    setNewReceipt({ patientName: '', patientAge: 25, serviceId: '', doctorId: '', paymentMethod: 'cash' });
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
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
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
            <p>سند استعلامات طبي</p>
          </div>
          <div class="info-grid">
            <div><span class="label">رقم السند:</span> ${receipt.id}</div>
            <div><span class="label">التاريخ:</span> ${receipt.date}</div>
            <div><span class="label">اسم المريض:</span> ${receipt.patientName}</div>
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">سندات الاستعلامات</h2>
          <p className="text-sm text-slate-500">تسجيل زيارات المرضى والخدمات المقدمة</p>
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

      <div className="glass-card rounded-3xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-8 py-4 font-medium">رقم السند</th>
              <th className="px-8 py-4 font-medium">المريض</th>
              <th className="px-8 py-4 font-medium">الخدمة / الدكتور</th>
              <th className="px-8 py-4 font-medium">المبلغ</th>
              <th className="px-8 py-4 font-medium">التاريخ</th>
              <th className="px-8 py-4 font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReceipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-400 text-xs">#{receipt.id}</td>
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{receipt.patientName}</div>
                  <div className="text-[10px] text-slate-400">{receipt.patientAge} عام</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-xs font-semibold text-sky-600">{services.find(s => s.id === receipt.serviceId)?.name}</div>
                  <div className="text-[10px] text-slate-500">د. {doctors.find(d => d.id === receipt.doctorId)?.name}</div>
                </td>
                <td className="px-8 py-5 font-black text-slate-800">{receipt.amount.toLocaleString()} <small className="text-[10px] text-slate-400">ر.ي</small></td>
                <td className="px-8 py-5 text-slate-500 text-xs">{receipt.date}</td>
                <td className="px-8 py-5">
                   <div className="flex gap-2">
                     <button onClick={() => handlePrint(receipt)} className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
                        <Printer size={16} />
                     </button>
                     <button onClick={() => setReceipts(receipts.filter(r => r.id !== receipt.id))} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={16} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReceipts.length === 0 && (
          <div className="py-20 text-center text-slate-400">لا توجد سندات مسجلة بهذا الاسم</div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10">
              <h3 className="text-2xl font-bold mb-8">إصدار سند استعلامات جديد</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> اسم المريض
                    </label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10" value={newReceipt.patientName} onChange={(e) => setNewReceipt({...newReceipt, patientName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">العمر</label>
                    <input required type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10" value={newReceipt.patientAge} onChange={(e) => setNewReceipt({...newReceipt, patientAge: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ActivityIcon size={14} /> الخدمة المطلوبة
                    </label>
                    <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 appearance-none" value={newReceipt.serviceId} onChange={(e) => setNewReceipt({...newReceipt, serviceId: e.target.value})}>
                      <option value="">اختر الخدمة...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} ر.ي)</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Stethoscope size={14} /> الطبيب المختص
                    </label>
                    <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 appearance-none" value={newReceipt.doctorId} onChange={(e) => setNewReceipt({...newReceipt, doctorId: e.target.value})}>
                      <option value="">اختر الطبيب...</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> طريقة الدفع
                   </label>
                   <div className="flex gap-4">
                      {['cash', 'credit'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewReceipt({...newReceipt, paymentMethod: method as any})}
                          className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${newReceipt.paymentMethod === method ? 'bg-sky-50 bordersky-500 text-sky-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >
                          {method === 'cash' ? 'نقداً' : 'آجل / تأمين'}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button type="submit" className="flex-1 bg-sky-500 text-white py-5 rounded-3xl font-bold shadow-xl shadow-sky-200 hover:bg-sky-600 transition-all hover:-translate-y-1">حفظ وإصدار السند</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-5 bg-slate-100 text-slate-600 rounded-3xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
