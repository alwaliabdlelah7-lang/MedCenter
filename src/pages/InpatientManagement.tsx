import React, { useState, useEffect } from 'react';
import { Bed, Plus, Search, User, Trash2, Home, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department } from '../types';
import { INITIAL_DEPARTMENTS } from '../data/seedData';

interface Inpatient {
  id: string;
  patientName: string;
  roomNumber: string;
  bedNumber: string;
  departmentId: string;
  admissionDate: string;
  status: 'active' | 'discharged';
}

export default function InpatientManagement() {
  const [inpatients, setInpatients] = useState<Inpatient[]>(() => {
    const saved = localStorage.getItem('hospital_inpatients');
    return saved ? JSON.parse(saved) : [];
  });

  const [departments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('hospital_departments');
    if (saved) return JSON.parse(saved);
    return INITIAL_DEPARTMENTS as Department[];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newInpatient, setNewInpatient] = useState<Partial<Inpatient>>({
    patientName: '',
    roomNumber: '',
    bedNumber: '',
    departmentId: departments[0]?.id || '',
  });

  useEffect(() => {
    localStorage.setItem('hospital_inpatients', JSON.stringify(inpatients));
  }, [inpatients]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInpatient.patientName || !newInpatient.roomNumber) return;

    const admission: Inpatient = {
      id: `ADM-${Date.now().toString().slice(-4)}`,
      patientName: newInpatient.patientName!,
      roomNumber: newInpatient.roomNumber!,
      bedNumber: newInpatient.bedNumber || '1',
      departmentId: newInpatient.departmentId!,
      admissionDate: new Date().toLocaleDateString('ar-YE'),
      status: 'active'
    };

    setInpatients([admission, ...inpatients]);
    setShowAddModal(false);
    setNewInpatient({ patientName: '', roomNumber: '', bedNumber: '', departmentId: departments[0]?.id || '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الرقود</h2>
          <p className="text-sm text-slate-500">متابعة المرضى المنومين في الأقسام الطبية</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95"
        >
          <Bed size={20} />
          <span>تسجيل دخول مريض</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl bg-indigo-50/50 border-indigo-100">
           <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Home size={20} />
              <span className="text-sm font-bold">الأسرة المشغولة</span>
           </div>
           <h3 className="text-3xl font-black text-indigo-700">{inpatients.filter(p => p.status === 'active').length}</h3>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-8 py-4 font-medium">المريض</th>
              <th className="px-8 py-4 font-medium">القسم</th>
              <th className="px-8 py-4 font-medium">الغرفة / السرير</th>
              <th className="px-8 py-4 font-medium">تاريخ الدخول</th>
              <th className="px-8 py-4 font-medium">الحالة</th>
              <th className="px-8 py-4 font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inpatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{patient.patientName}</div>
                  <div className="text-[10px] text-slate-400">#{patient.id}</div>
                </td>
                <td className="px-8 py-5 text-sm font-medium">
                  {departments.find(d => d.id === patient.departmentId)?.name}
                </td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span>غرفة: {patient.roomNumber}</span>
                      <span className="text-slate-300">|</span>
                      <span>سرير: {patient.bedNumber}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-xs text-slate-500">{patient.admissionDate}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${patient.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {patient.status === 'active' ? 'مرقد حالياً' : 'خرج'}
                  </span>
                </td>
                <td className="px-8 py-5">
                   <div className="flex gap-2">
                      <button onClick={() => setInpatients(inpatients.filter(p => p.id !== patient.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-sky-500 transition-colors">
                        <ArrowRightLeft size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inpatients.length === 0 && (
          <div className="py-20 text-center text-slate-400">لا يوجد مرضى مرقدين حالياً</div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-xl font-bold mb-6">تسجيل دخول مريض للرقود</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">اسم المريض</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={newInpatient.patientName} onChange={(e) => setNewInpatient({...newInpatient, patientName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">رقم الغرفة</label>
                    <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={newInpatient.roomNumber} onChange={(e) => setNewInpatient({...newInpatient, roomNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">رقم السرير</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={newInpatient.bedNumber} onChange={(e) => setNewInpatient({...newInpatient, bedNumber: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">القسم</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={newInpatient.departmentId} onChange={(e) => setNewInpatient({...newInpatient, departmentId: e.target.value})}>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-bold">تسجيل الدخول</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
