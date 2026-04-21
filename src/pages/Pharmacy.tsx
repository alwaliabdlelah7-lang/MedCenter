import React, { useState, useEffect } from 'react';
import { Plus, Search, Pill, Package, DollarSign, Trash2, AlertTriangle, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PharmacyItem, MasterMedicine } from '../types';
import { YEMEN_MEDICINES } from '../data/seedData';
import { cn } from '../lib/utils';
import { dataStore } from '../services/dataService';

export default function Pharmacy() {
  const [masterMedicines, setMasterMedicines] = useState<MasterMedicine[]>([]);
  const [inventory, setInventory] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invData, masterData] = await Promise.all([
          dataStore.getAll<PharmacyItem>('pharmacy_inventory'),
          dataStore.getAll<MasterMedicine>('master_medicines')
        ]);
        setInventory(invData);
        setMasterMedicines(masterData);
        
        // Seed logic if both empty
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItem, setNewItem] = useState<Partial<PharmacyItem>>({
    name: '',
    category: 'أدوية عامة',
    price: 0,
    stock: 0,
    expiryDate: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const item: PharmacyItem = {
      id: `PHM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: newItem.name!,
      category: newItem.category!,
      price: newItem.price!,
      stock: newItem.stock!,
      expiryDate: newItem.expiryDate!
    };
    
    await dataStore.addItem('pharmacy_inventory', item);
    setInventory([...inventory, item]);
    setShowAddModal(false);
    setNewItem({ name: '', category: 'أدوية عامة', price: 0, stock: 0, expiryDate: '' });
  };

  const [showSalesModal, setShowSalesModal] = useState(false);
  const [saleCart, setSaleCart] = useState<{ id: string, name: string, qty: number, price: number }[]>([]);
  const [patientName, setPatientName] = useState('');

  const addToCart = (med: PharmacyItem) => {
    const existing = saleCart.find(c => c.id === med.id);
    if (existing) {
       setSaleCart(saleCart.map(c => c.id === med.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
       setSaleCart([...saleCart, { id: med.id, name: med.name, qty: 1, price: med.price }]);
    }
  };

  const handleSale = async () => {
    if (!patientName || saleCart.length === 0) return;
    
    try {
      // Update Stock in DB
      for (const cartItem of saleCart) {
        const invItem = inventory.find(i => i.id === cartItem.id);
        if (invItem) {
          await dataStore.updateItem<PharmacyItem>('pharmacy_inventory', invItem.id, { stock: invItem.stock - cartItem.qty });
        }
      }

      // Update Local State
      const newInventory = inventory.map(item => {
        const cartItem = saleCart.find(c => c.id === item.id);
        if (cartItem) {
          return { ...item, stock: item.stock - cartItem.qty };
        }
        return item;
      });
      
      setInventory(newInventory);
      setShowSalesModal(false);
      setSaleCart([]);
      setPatientName('');
      alert('تمت عملية البيع وصرف الدواء بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إتمام البيع');
    }
  };

  const filtered = inventory.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">الصيدلية والمخزن الدوائي</h2>
          <p className="text-sm text-sky-300/70 border-r-2 border-sky-500 pr-2">إدارة مخزون الأدوية، المبيعات الصيدلانية، وتواريخ الصلاحية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن دواء أو صنف..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-sky-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowSalesModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <DollarSign size={20} />
            <span>نقطة بيع / صرف</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة صنف دوائي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         <StatCard label="إجمالي الأصناف" value={inventory.length} color="sky" icon={ListFilter} />
         <StatCard label="أصناف قاربت على النفاد" value={inventory.filter(i => i.stock < 10).length} color="amber" icon={AlertTriangle} />
         <StatCard label="إجمالي قيمة المخزون" value={`${inventory.reduce((acc, i) => acc + (i.price * i.stock), 0).toLocaleString()} ر.ي`} color="emerald" icon={DollarSign} />
         <StatCard label="أصناف منتهية" value={inventory.filter(i => new Date(i.expiryDate) < new Date()).length} color="rose" icon={Pill} />
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest italic">
                <th className="px-6 py-4 font-bold border-b border-white/5">الصنف / الاسم التجاري</th>
                <th className="px-6 py-4 font-bold border-b border-white/5">المجموعة</th>
                <th className="px-6 py-4 font-bold border-b border-white/5">السعر</th>
                <th className="px-6 py-4 font-bold border-b border-white/5">المخزون المتوفر</th>
                <th className="px-6 py-4 font-bold border-b border-white/5">تاريخ الانتهاء</th>
                <th className="px-6 py-4 font-bold border-b border-white/5">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="p-2 glass bg-white/5 text-sky-400 rounded-lg group-hover:bg-sky-500/10 transition-colors">
                         <Pill size={16} />
                       </div>
                       <div className="font-bold text-white tracking-wide">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400 text-xs">{item.category}</td>
                  <td className="px-6 py-5 text-emerald-400 font-mono font-bold">{item.price} ر.ي</td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-2">
                       <span className={`w-8 text-center font-bold font-mono ${item.stock < 10 ? 'text-amber-500' : 'text-sky-400'}`}>{item.stock}</span>
                       <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.stock < 10 ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(item.stock * 2, 100)}%` }} />
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-mono italic">
                    {item.expiryDate}
                    {new Date(item.expiryDate) < new Date() && <span className="mr-2 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold uppercase">منتهي</span>}
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => setInventory(inventory.filter(i => i.id !== item.id))}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showSalesModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSalesModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl glass bg-slate-900/90 rounded-[40px] p-10 border border-white/10 flex flex-col md:flex-row gap-8">
               <div className="flex-1 space-y-6 text-right">
                  <h3 className="text-2xl font-black mb-8 text-white border-r-4 border-indigo-500 pr-5 italic uppercase tracking-tighter">نافذة البيع والصرف</h3>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">اسم المريض / العميل</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold"
                          placeholder="أدخل اسم المريض..."
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">بحث وإضافة صنف</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {inventory.filter(i => i.stock > 0).map(item => (
                             <button 
                               key={item.id}
                               onClick={() => addToCart(item)}
                               className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-right"
                             >
                                <div>
                                   <p className="text-xs font-bold text-white">{item.name}</p>
                                   <p className="text-[9px] text-slate-500 italic">المتوفر: {item.stock} - السعر: {item.price} ر.ي</p>
                                </div>
                                <Plus size={16} className="text-emerald-500" />
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="w-full md:w-80 glass bg-white/5 rounded-[32px] p-6 border border-white/5 flex flex-col">
                  <div className="flex items-center gap-2 mb-6 text-indigo-400">
                     <Package size={20} />
                     <h4 className="font-black text-sm uppercase tracking-widest">سلة المشتريات</h4>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar mb-6">
                     {saleCart.map(item => (
                       <div key={item.id} className="flex flex-col gap-1 border-b border-white/5 pb-2">
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-white leading-tight">{item.name}</span>
                             <button onClick={() => setSaleCart(saleCart.filter(c => c.id !== item.id))} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg"><Trash2 size={12} /></button>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                             <span className="text-slate-500">{item.qty} x {item.price}</span>
                             <span className="text-emerald-400 font-bold">{item.qty * item.price} ر.ي</span>
                          </div>
                       </div>
                     ))}
                     {saleCart.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-12 opacity-20">
                          <Package size={48} className="text-slate-500 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">السلة فارغة</p>
                       </div>
                     )}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">الإجمالي كلياً</span>
                        <span className="text-xl font-black text-white">{saleCart.reduce((acc, i) => acc + (i.qty * i.price), 0).toLocaleString()} <small className="text-[10px] text-slate-500">ر.ي</small></span>
                     </div>
                     <button 
                       onClick={handleSale}
                       disabled={!patientName || saleCart.length === 0}
                       className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs"
                     >
                        إتمام عملية الصرف
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass bg-slate-900/90 rounded-3xl p-8 border border-white/10">
               <h3 className="text-xl font-bold mb-6 text-white text-right border-r-4 border-emerald-500 pr-4">إضافة صنف دوائي جديد</h3>
               <form onSubmit={handleAdd} className="space-y-4 text-right">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">اختر الصنف من الدليل</label>
                    <select 
                      className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none appearance-none font-bold"
                      onChange={(e) => {
                        const med = masterMedicines.find((m: any) => m.id === e.target.value);
                        if (med) {
                          setNewItem({
                            ...newItem,
                            name: med.tradeName,
                            category: med.category,
                            price: med.price,
                          });
                        }
                      }}
                    >
                      <option value="" className="bg-slate-900">-- اختر الصنف --</option>
                      {masterMedicines.map((m: any) => (
                        <option key={m.id} value={m.id} className="bg-slate-900">{m.tradeName} ({m.scientificName})</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 italic block">الاسم المختار</label>
                    <input required disabled className="w-full px-4 py-3 glass bg-white/10 border border-white/10 rounded-2xl text-white outline-none opacity-60" value={newItem.name} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">المجموعة</label>
                      <input disabled className="w-full px-4 py-3 glass bg-white/10 border border-white/10 rounded-2xl text-white outline-none opacity-60" value={newItem.category} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">سعر البيع المعتمد</label>
                      <input disabled className="w-full px-4 py-3 glass bg-white/10 border border-white/10 rounded-2xl text-white outline-none opacity-60 font-mono" value={newItem.price} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">الكمية المتوفرة</label>
                      <input type="number" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-mono" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">تاريخ الانتهاء</label>
                      <input type="date" className="w-full px-4 py-3 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-mono" value={newItem.expiryDate} onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                   <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all">حفظ الصنف</button>
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

function StatCard({ label, value, color, icon: Icon }: { label: string, value: string | number, color: string, icon: any }) {
  const colors: Record<string, string> = {
    sky: 'text-sky-400 bg-sky-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div className="glass p-5 rounded-2xl flex items-center justify-between group hover:translate-y-[-2px] transition-all">
       <div>
         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 italic">{label}</p>
         <h4 className="text-xl font-bold text-white">{value}</h4>
       </div>
       <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", colors[color])}>
         <Icon size={20} />
       </div>
    </div>
  );
}
