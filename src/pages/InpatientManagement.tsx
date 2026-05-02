import React, { useState, useEffect } from 'react';
import { Bed, Plus, Search, User, Trash2, Home, ArrowRightLeft, Clock, Building2, Stethoscope, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Department, Patient } from '../types';
import { dataStore } from '../services/dataService';

interface Inpatient {
  id: string;
  patientId?: string;
  patientName: string;
  roomNumber: string;
  bedNumber: string;
  departmentId: string;
  admissionDate: string;
  status: 'active' | 'discharged';
  diagnosis?: string;
  attendingDoctorId?: string;
}

export default function InpatientManagement() {
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newInpatient, setNewInpatient] = useState<Partial<Inpatient>>({
    patientName: '',
    roomNumber: '',
    bedNumber: '',
    departmentId: '',
    diagnosis: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [inp, dept, pts] = await Promise.all([
          dataStore.getAll<Inpatient>('inpatients'),
          dataStore.getAll<Department>('departments'),
          dataStore.getAll<Patient>('patients'),
        ]);
        setInpatients(inp);
        setDepartments(dept);
        setPatients(pts);
        if (!newInpatient.departmentId && dept.length > 0) {
          setNewInpatient(prev => ({ ...prev, departmentId: dept[0].id }));
        }
      } catch (err) {
        console.error('Failed to load inpatient data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const unsub = dataStore.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInpatient.patientName || !newInpatient.roomNumber) return;

    const admission: Inpatient = {
      id: `ADM-${Date.now().toString().slice(-6)}`,
      patientName: newInpatient.patientName!,
      roomNumber: newInpatient.roomNumber!,
      bedNumber: newInpatient.bedNumber || '1',
      departmentId: newInpatient.departmentId || departments[0]?.id || '',
      admissionDate: new Date().toISOString().split('T')[0],
      diagnosis: newInpatient.diagnosis || '',
      status: 'active',
    };

    await dataStore.addItem('inpatients', admission);
    setShowAddModal(false);
    setNewInpatient({ patientName: '', roomNumber: '', bedNumber: '', departmentId: departments[0]?.id || '', diagnosis: '' });
  };

  const handleDischarge = async (id: string) => {
    const record = inpatients.find(p => p.id === id);
    if (!record) return;
    await dataStore.updateItem('inpatients', id, { status: 'discharged' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا السجل نهائياً؟')) return;
    await dataStore.deleteItem('inpatients', id);
  };

  const filtered = inpatients.filter(p =>
    p.patientName.includes(searchQuery) || p.roomNumber.includes(searchQuery) || (p.diagnosis || '').includes(searchQuery)
  );

  const active = inpatients.filter(p => p.status === 'active').length;
  const discharged = inpatients.filter(p => p.status === 'discharged').length;

  const deptName = (id: string) => departments.find(d => d.id === id)?.name || '—';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Bed size={22} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">الأسرة المشغولة</p>
            <p className="text-2xl font-black text-indigo-700">{active}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">المخرجون</p>
            <p className="text-2xl font-black text-emerald-700">{discharged}</p>
          </div>
        </div>
        <div className="glass-card p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
            <Building2 size={22} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">الأقسام الفعالة</p>
            <p className="text-2xl font-black text-violet-700">{departments.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث بالاسم أو الغرفة أو التشخيص..."
          className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[700px]">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">المريض</th>
                <th className="px-6 py-4 font-medium">القسم</th>
                <th className="px-6 py-4 font-medium">الغرفة / السرير</th>
                <th className="px-6 py-4 font-medium">التشخيص</th>
                <th className="px-6 py-4 font-medium">تاريخ الدخول</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filtered.map((patient) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <User size={16} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{patient.patientName}</p>
                          <p className="text-[10px] text-slate-400">#{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{deptName(patient.departmentId)}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-600 space-y-0.5">
                        <div>غرفة: {patient.roomNumber}</div>
                        <div className="text-slate-400">سرير: {patient.bedNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">{patient.diagnosis || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {patient.admissionDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${patient.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {patient.status === 'active' ? 'مرقد حالياً' : 'خرج'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {patient.status === 'active' && (
                          <button
                            onClick={() => handleDischarge(patient.id)}
                            title="تسجيل خروج"
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <ArrowRightLeft size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(patient.id)}
                          title="حذف"
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد مرضى مرقدين حالياً'}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Bed size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">تسجيل دخول مريض للرقود</h3>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">اختر المريض</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                    value={newInpatient.patientId || ''}
                    onChange={(e) => {
                      const pt = patients.find(p => p.id === e.target.value);
                      setNewInpatient({ ...newInpatient, patientId: e.target.value, patientName: pt?.name || '' });
                    }}
                  >
                    <option value="">— كتابة يدوية —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {!newInpatient.patientId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">اسم المريض (يدوي)</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                      value={newInpatient.patientName}
                      onChange={(e) => setNewInpatient({ ...newInpatient, patientName: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">التشخيص</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                    placeholder="التشخيص عند الدخول"
                    value={newInpatient.diagnosis}
                    onChange={(e) => setNewInpatient({ ...newInpatient, diagnosis: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">رقم الغرفة</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                      value={newInpatient.roomNumber}
                      onChange={(e) => setNewInpatient({ ...newInpatient, roomNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">رقم السرير</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                      value={newInpatient.bedNumber}
                      onChange={(e) => setNewInpatient({ ...newInpatient, bedNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">القسم</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                    value={newInpatient.departmentId}
                    onChange={(e) => setNewInpatient({ ...newInpatient, departmentId: e.target.value })}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-colors">
                    تسجيل الدخول
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
