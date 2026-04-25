import React, { useState, useEffect } from 'react';
import { Plus, Search, Pill, Package, DollarSign, Trash2, AlertTriangle, ListFilter, ClipboardCheck, History, Clock, User, Download, Printer, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PharmacyItem, MasterMedicine, Prescription } from '../types';
import { YEMEN_MEDICINES } from '../data/seedData';
import { cn } from '../lib/utils';
import { dataStore } from '../services/dataService';
import { exportToCSV, printReport } from '../lib/exportUtils';

export default function Pharmacy() {
  const [masterMedicines, setMasterMedicines] = useState<MasterMedicine[]>([]);
  const [inventory, setInventory] = useState<PharmacyItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invData, masterData, prescriptionsData] = await Promise.all([
          dataStore.getAll<PharmacyItem>('pharmacy_inventory'),
          dataStore.getAll<MasterMedicine>('master_medicines'),
          dataStore.getAll<Prescription>('pharmacy_prescriptions')
        ]);
        setInventory(invData);
        setMasterMedicines(masterData);
        setPrescriptions(prescriptionsData);
        
        if (invData.length === 0 && masterData.length === 0) {
           const seeded = YEMEN_MEDICINES.slice(0, 10).map((m: any, idx: number) => ({
             id: `PHM-${idx}`,
             name: m.tradeName,
             category: 'أدوية عامة',
             price: m.price,
             stock: 50,
             expiryDate: '2027-12-30'
           }));
           setInventory(seeded);
        }
      } catch (error) {
        console.error("Failed to load pharmacy data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const itemData: any = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      expiryDate: formData.get('expiryDate') as string,
    };

    if (editingItem) {
      const updated = { ...editingItem, ...itemData };
      await dataStore.updateItem('pharmacy_inventory', editingItem.id, updated);
      setInventory(inventory.map(i => i.id === editingItem.id ? updated : i));
    } else {
      const newItem = {
        ...itemData,
        id: `PHM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };
      await dataStore.addItem('pharmacy_inventory', newItem);
      setInventory([...inventory, newItem]);
    }
    
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف من المخزن؟')) {
      await dataStore.deleteItem('pharmacy_inventory', id);
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const handleExportCSV = () => {
    const data = (activeTab === 'inventory' ? inventory : prescriptions).map((item: any) => ({
      'المعرف': item.id,
      'الاسم': item.name || item.patientName || '---',
      'التصنيف/الحالة': item.category || item.status || '---',
      'السعر/التاريخ': item.price || item.date || 0,
      'الكمية': item.stock || '---',
      'تاريخ الانتهاء': item.expiryDate || '---'
    }));
    exportToCSV(data, `pharmacy_${activeTab}`);
  };

  const filtered = (activeTab === 'inventory' ? inventory : prescriptions).filter((p: any) => 
    (p.name || p.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || p.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">إدارة الصيدلية والمخزن الدوائي</h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">إدارة المخزون، صرف الوصفات، ومراقبة تواريخ الصلاحية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الصنف..." 
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
            onClick={() => printReport('تقرير الصيدلية', activeTab === 'inventory' ? 'pharmacy-inventory-table' : 'pharmacy-prescriptions-list')}
            className="p-2.5 glass bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
            title="طباعة التقرير"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة صنف دوائي</span>
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2",
            activeTab === 'inventory' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Package size={14} /> المخزن والمستودع
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={cn(
            "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2",
            activeTab === 'prescriptions' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <ClipboardCheck size={14} /> صرف الوصفات الطبية
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
             <StatCard label="إجمالي الأصناف" value={inventory.length} color="sky" icon={ListFilter} />
             <StatCard label="أصناف منخفضة المخزون" value={inventory.filter(i => i.stock < 10).length} color="amber" icon={AlertTriangle} />
             <StatCard label="قيمة المخزون" value={`${inventory.reduce((acc, i) => acc + (i.price * i.stock), 0).toLocaleString()} ر.ي`} color="emerald" icon={DollarSign} />
             <StatCard label="أصناف منتهية" value={inventory.filter(i => new Date(i.expiryDate) < new Date()).length} color="rose" icon={Pill} />
          </div>

          <div className="glass rounded-[32px] overflow-hidden border border-white/5 shadow-2xl" id="pharmacy-inventory-table">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-black italic">
                    <th className="px-8 py-6 font-bold border-b border-white/5">المعرف</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5">الصنف الدوائي</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5">المجموعة</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5">السعر (ر.ي)</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5">الكمية المتوفرة</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5 text-center">تاريخ الانتهاء</th>
                    <th className="px-8 py-6 font-bold border-b border-white/5 no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((item: any) => {
                    const isExpiringSoon = new Date(item.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                    const isLowStock = item.stock < 10;
                    
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                           <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg tracking-tighter">#{item.id}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
                              <Pill size={18} />
                            </div>
                            <span className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400">{item.category}</span>
                        </td>
                        <td className="px-8 py-5 font-black text-emerald-400">{item.price.toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               isLowStock ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                             )} />
                             <span className={cn("font-black text-sm", isLowStock ? "text-rose-400" : "text-white")}>
                               {item.stock} <span className="text-[10px] text-slate-500">وحدة</span>
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className={cn(
                             "text-[10px] font-black px-3 py-1 rounded-full",
                             isExpiringSoon ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/5 text-slate-500 border border-white/5"
                           )}>
                             {item.expiryDate}
                           </span>
                        </td>
                        <td className="px-8 py-5 no-print">
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => {
                                setEditingItem(item);
                                setShowAddModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-sky-600 rounded-lg transition-all"
                             >
                               <Edit2 size={14} />
                             </button>
                             <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-600 rounded-lg transition-all"
                             >
                               <Trash2 size={14} />
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
        </>
      ) : (
        <div id="pharmacy-prescriptions-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filtered.map((pres: any) => (
             <div key={pres.id} className="glass p-8 rounded-[40px] border border-white/5 relative group hover:bg-white/5 transition-all overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                         <ClipboardCheck size={28} />
                      </div>
                      <div>
                         <h3 className="font-black text-white">{pres.patientName}</h3>
                         <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-1">وصفة طبية • {pres.date}</p>
                      </div>
                   </div>
                   <span className={cn(
                     "text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest italic",
                     pres.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                   )}>
                     {pres.status === 'completed' ? 'تم الصرف' : 'بالانتظار'}
                   </span>
                </div>
                
                <div className="space-y-3 pt-6 border-t border-white/5 text-right">
                   {pres.medicines.map((m: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between text-xs hover:bg-white/5 p-1 rounded transition-colors group/item">
                        <span className="text-slate-500 font-bold font-mono no-print">#{idx+1}</span>
                        <div className="flex flex-col items-end">
                           <span className="text-white font-black">{m.name}</span>
                           <span className="text-[10px] text-indigo-400 font-bold italic">{m.instruction}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-8 flex gap-3 no-print">
                   <button className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">صرف الأدوية</button>
                   <button className="p-3 glass-card rounded-2xl text-slate-500 hover:text-white transition-colors" title="طباعة الوصفة">
                      <Printer size={18} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 30, opacity: 0 }} 
              className="relative w-full max-w-xl glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10 text-right overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white border-r-4 border-emerald-500 pr-5">
                   {editingItem ? 'تعديل بيانات الصنف الدوائي' : 'إضافة صنف دوائي جديد'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-6">
                <InputGroup name="name" label="اسم الدواء / الصنف" defaultValue={editingItem?.name} placeholder="مثال: Amoxicillin 500mg" icon={Pill} required />
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic text-right block">المجموعة / الفئة</label>
                    <select name="category" defaultValue={editingItem?.category || 'أدوية عامة'} className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold">
                      <option value="أدوية عامة" className="bg-slate-900">أدوية عامة</option>
                      <option value="مضادات حيوية" className="bg-slate-900">مضادات حيوية</option>
                      <option value="مسكنات" className="bg-slate-900">مسكنات</option>
                      <option value="فيتامينات" className="bg-slate-900">فيتامينات</option>
                      <option value="سوائل وريدية" className="bg-slate-900">سوائل وريدية</option>
                    </select>
                  </div>
                  <InputGroup name="price" label="سعر البيع (ر.ي)" defaultValue={editingItem?.price} type="number" icon={DollarSign} required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <InputGroup name="stock" label="الكمية المتوفرة" defaultValue={editingItem?.stock} type="number" icon={Package} required />
                  <InputGroup name="expiryDate" label="تاريخ الانتهاء" defaultValue={editingItem?.expiryDate} type="date" icon={Clock} required />
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all uppercase tracking-[4px]">
                    {editingItem ? 'تحديث البيانات' : 'حفظ الصنف'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 glass bg-white/10 text-slate-500 rounded-3xl font-black hover:bg-white/20 transition-all uppercase tracking-[4px]">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: any) {
  const colors: any = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  return (
    <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", colors[color])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase italic opacity-70 tracking-wider">{label}</p>
        <p className="text-xl font-black text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function InputGroup({ name, label, defaultValue, placeholder, icon: Icon, required, type = "text" }: any) {
  return (
    <div className="space-y-2 text-right">
      <label className="text-[10px] font-black text-slate-500 uppercase italic">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />}
        <input 
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          className="w-full pr-12 pl-4 font-mono py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold focus:border-emerald-500 transition-all shadow-inner"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
