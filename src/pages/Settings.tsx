import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Cloud, Database, Monitor, Printer, Smartphone, Save, Plus, Trash2, Tag, Calendar, List, CheckSquare, Type, Hash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicFieldDefinition } from '../types';

export default function SettingsPage() {
  const [hospitalName, setHospitalName] = useState('إبداع الطبي');
  const [legalName, setLegalName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [serverIp, setServerIp] = useState('192.168.1.105');
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [printAuto, setPrintAuto] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'dynamic_fields' | 'cloud'>('general');
  const [isSeeding, setIsSeeding] = useState(false);

  const seedDatabase = async () => {
    if (!confirm('هل أنت متأكد من زرع البيانات الأولية في قاعدة البيانات السحابية؟ سيتم إضافة البيانات فقط إذا كانت المجموعات فارغة.')) return;
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        alert('تم زرع البيانات بنجاح: ' + data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('فشل في زرع البيانات: ' + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDefinition[]>(() => {
    const saved = localStorage.getItem('hospital_dynamic_fields');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<DynamicFieldDefinition>>({
    label: '',
    type: 'text',
    required: false,
    entity: 'patient',
    isActive: true,
    options: []
  });

  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    localStorage.setItem('hospital_dynamic_fields', JSON.stringify(dynamicFields));
  }, [dynamicFields]);

  const handleAddField = () => {
    if (!newField.label) return;
    const field: DynamicFieldDefinition = {
      id: `field_${Date.now()}`,
      label: newField.label!,
      type: newField.type as any,
      required: !!newField.required,
      entity: newField.entity as any,
      isActive: true,
      options: newField.options
    };
    setDynamicFields([...dynamicFields, field]);
    setIsAddingField(false);
    setNewField({ label: '', type: 'text', required: false, entity: 'patient', isActive: true, options: [] });
  };

  const deleteField = (id: string) => {
    setDynamicFields(dynamicFields.filter(f => f.id !== id));
  };

  useEffect(() => {
    const saved = localStorage.getItem('hospital_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setHospitalName(settings.hospitalName || 'إبداع الطبي');
      setLegalName(settings.legalName || '');
      setTaxNumber(settings.taxNumber || '');
      setHospitalPhone(settings.hospitalPhone || '');
      setHospitalAddress(settings.hospitalAddress || '');
      setLogoUrl(settings.logoUrl || '');
      setServerIp(settings.serverIp || '192.168.1.105');
      setPrintAuto(settings.printAuto || false);
      setIsRealtimeEnabled(settings.isRealtimeEnabled !== undefined ? settings.isRealtimeEnabled : true);
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('hospital_settings', JSON.stringify({
      hospitalName,
      legalName,
      taxNumber,
      hospitalPhone,
      hospitalAddress,
      logoUrl,
      serverIp,
      isRealtimeEnabled,
      printAuto
    }));
    // Also save hospital name separately for easier access
    localStorage.setItem('hospital_name', hospitalName);
  };

  return (
    <div className="space-y-8 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">إعدادات النظام</h2>
          <p className="text-sm text-sky-300/70 border-r-4 border-sky-500 pr-3 font-medium">تكوين الخصائص العامة، الربط بالسيرفر، وتخصيص بيانات النظام</p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 glass bg-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white/10 text-sky-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
        >
          الإعدادات العامة
        </button>
        <button 
          onClick={() => setActiveTab('dynamic_fields')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dynamic_fields' ? 'bg-white/10 text-sky-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
        >
          تخصيص البيانات (الحقول الديناميكية)
        </button>
        <button 
          onClick={() => setActiveTab('cloud')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cloud' ? 'bg-white/10 text-sky-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
        >
          البيانات السحابية (Firebase)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'cloud' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="glass p-8 rounded-[40px] space-y-6 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Cloud className="text-sky-400" size={20} />
                    <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Cloud Database Seeding</h3>
                  </div>
                  
                  <div className="bg-sky-500/10 border border-sky-500/20 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sky-400 font-bold flex items-center gap-2">
                       <Database size={18} />
                       زرع البيانات الأولية
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      هذه الإضافة تسمح لك بتهيئة قاعدة البيانات السحابية (Firebase) بمجموعة كاملة من البيانات الحقيقية والمهنية (الأطباء، الأصناف الدوائية، الفحوصات المخبرية، الأقسام، العيادات).
                      <br /><b>ملاحظة:</b> لن يتم تكرار البيانات إذا كانت موجودة مسبقاً.
                    </p>
                    <button 
                      onClick={seedDatabase}
                      disabled={isSeeding}
                      className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-sky-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSeeding ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري الزرع...</span>
                        </>
                      ) : (
                        <>
                          <Database size={20} />
                          <span>زرع البيانات المهنية الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'general' ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {/* General Config */}
                <div className="glass p-8 rounded-[40px] space-y-6 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor className="text-sky-400" size={20} />
                    <h3 className="text-white font-black italic uppercase tracking-widest text-sm">General Configuration</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">اسم المنشأة الطبية (التجاري)</label>
                      <input 
                        type="text" 
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">الاسم القانوني الكامل</label>
                      <input 
                        type="text" 
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                        placeholder="الاسم المسجل رسمياً..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">الرقم الضريبي</label>
                      <input 
                        type="text" 
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono"
                        placeholder="Tax ID / VAT..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">رقم الهاتف/الجوال الرئيسي</label>
                      <input 
                        type="text" 
                        value={hospitalPhone}
                        onChange={(e) => setHospitalPhone(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono"
                        placeholder="رقم التواصل الرئيسي..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">عنوان المنشأة</label>
                      <input 
                        type="text" 
                        value={hospitalAddress}
                        onChange={(e) => setHospitalAddress(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-bold"
                        placeholder="العنوان الكامل - المدينة - الحي..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">رابط الشعار (Logo URL)</label>
                      <input 
                        type="text" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono text-xs"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase italic">عنوان سيرفر الربط (IP)</label>
                      <input 
                        type="text" 
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 font-mono text-sky-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Database & Sync */}
                <div className="glass p-8 rounded-[40px] space-y-6 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="text-emerald-400" size={20} />
                    <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Connectivity & Sync</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 glass bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl glass bg-sky-500/10 flex items-center justify-center text-sky-400">
                          <Cloud size={24} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-black">مزامنة البيانات سحابياً (Firebase)</p>
                          <p className="text-slate-500 text-[10px] italic mt-1">تفعيل المزامنة اللحظية بين جميع الأجهزة والعيادات</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
                        className={`w-14 h-7 rounded-full transition-all relative ${isRealtimeEnabled ? 'bg-sky-500' : 'bg-slate-800 border border-white/10'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xl transition-all ${isRealtimeEnabled ? 'left-1' : 'left-8'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 glass bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl glass bg-slate-500/10 flex items-center justify-center text-slate-400">
                          <Printer size={24} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-black">طباعة تلقائية للسندات</p>
                          <p className="text-slate-500 text-[10px] italic mt-1">إظهار نافذة الطباعة فور حفظ السند الجديد</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPrintAuto(!printAuto)}
                        className={`w-14 h-7 rounded-full transition-all relative ${printAuto ? 'bg-sky-500' : 'bg-slate-800 border border-white/10'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xl transition-all ${printAuto ? 'left-1' : 'left-8'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="glass p-8 rounded-[40px] border border-white/5">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <Tag className="text-indigo-400" size={24} />
                      <div>
                        <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Dynamic Form Fields</h3>
                        <p className="text-slate-500 text-xs mt-1 font-medium">إضافة حقول مخصصة لجمع بيانات إضافية في نماذج التسجيل</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAddingField(true)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      <Plus size={18} />
                      <span>إضافة حقل جديد</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dynamicFields.length > 0 ? dynamicFields.map(field => (
                      <div key={field.id} className="p-5 glass bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl glass bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            {field.type === 'text' && <Type size={18} />}
                            {field.type === 'number' && <Hash size={18} />}
                            {field.type === 'date' && <Calendar size={18} />}
                            {field.type === 'select' && <List size={18} />}
                            {field.type === 'boolean' && <CheckSquare size={18} />}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm tracking-tight">{field.label}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5 tracking-widest italic">{field.entity} • {field.type}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteField(field.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                        <Tag size={48} className="mb-4 text-slate-500" />
                        <p className="text-xs font-black uppercase tracking-[5px]">No Custom Fields Defined</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Security Summary */}
          <div className="glass p-8 rounded-[40px] space-y-8 border-r-4 border-sky-500 border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full" />
             <div className="flex items-center gap-3 relative z-10">
                <Shield className="text-sky-400" size={20} />
                <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Security Overview</h3>
             </div>
             <div className="space-y-4 relative z-10">
                <div className="text-center p-8 glass bg-white/5 border border-white/5 rounded-[35px] border-b-4 border-sky-500/20">
                  <Smartphone className="mx-auto mb-4 text-slate-700" size={48} />
                  <p className="text-white text-xs font-black uppercase tracking-widest">Mobile Integration</p>
                  <p className="text-slate-500 text-[10px] mt-3 leading-relaxed font-medium italic">تمت تهيئة معرفات الأجهزة للطاقم الطبي، يمكنك مسح الـ QR للربط اللحظي فوراً.</p>
                  <button className="mt-8 w-full py-4 glass bg-sky-500/10 text-sky-400 text-[10px] font-black rounded-2xl uppercase tracking-[3px] hover:bg-sky-500 hover:text-white transition-all shadow-xl">عرض رمز الربط QR</button>
                </div>
             </div>
          </div>

          <button 
            onClick={handleSaveSettings}
            className="w-full py-5 bg-sky-600 text-white rounded-[25px] font-black shadow-2xl shadow-sky-600/30 hover:bg-sky-500 transition-all flex items-center justify-center gap-4 uppercase tracking-[5px] active:scale-95"
          >
            <Save size={24} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Add Field Modal */}
      <AnimatePresence>
        {isAddingField && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingField(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass bg-[#0f172a]/95 rounded-[40px] p-10 border border-white/10">
              <h3 className="text-2xl font-black mb-10 text-white border-r-4 border-indigo-500 pr-5">تعريف حقول جمع البيانات</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase italic">عنوان الحقل</label>
                  <input 
                    type="text" 
                    placeholder="مثل: الأمراض المزمنة، فصيلة الدم الثانوية..."
                    className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-bold"
                    value={newField.label}
                    onChange={(e) => setNewField({...newField, label: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">نوع الحقل</label>
                    <select 
                      className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold"
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value as any, options: []})}
                    >
                      <option value="text" className="bg-slate-900">نص قصير</option>
                      <option value="number" className="bg-slate-900">رقم</option>
                      <option value="date" className="bg-slate-900">تاريخ</option>
                      <option value="select" className="bg-slate-900">قائمة خيارات (Select)</option>
                      <option value="boolean" className="bg-slate-900">منطقي (صح/خطأ)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase italic">مرتبط بـ</label>
                    <select 
                      className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-bold italic"
                      value={newField.entity}
                      onChange={(e) => setNewField({...newField, entity: e.target.value as any})}
                    >
                      <option value="patient" className="bg-slate-900">سجل المريض</option>
                      <option value="doctor" className="bg-slate-900">بيانات الطبيب</option>
                      <option value="nurse" className="bg-slate-900">بيانات التمريض</option>
                      <option value="visit" className="bg-slate-900">زيارة العيادة</option>
                      <option value="clinic" className="bg-slate-900">العيادات</option>
                      <option value="department" className="bg-slate-900">الأقسام</option>
                      <option value="companion" className="bg-slate-900">المرافقين</option>
                      <option value="service" className="bg-slate-900">دليل الخدمات</option>
                      <option value="operation" className="bg-slate-900">دليل العمليات</option>
                      <option value="lab_test" className="bg-slate-900">دليل المختبر</option>
                      <option value="medicine" className="bg-slate-900">دليل الصيدلية</option>
                      <option value="user" className="bg-slate-900">بيانات المستخدمين / الموظفين</option>
                    </select>
                  </div>
                </div>

                {newField.type === 'select' && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase italic">خيارات القائمة</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 px-4 py-2 glass bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 text-sm"
                        placeholder="أضف خيار..."
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (optionInput.trim()) {
                              setNewField({...newField, options: [...(newField.options || []), optionInput.trim()]});
                              setOptionInput('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (optionInput.trim()) {
                            setNewField({...newField, options: [...(newField.options || []), optionInput.trim()]});
                            setOptionInput('');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newField.options?.map((opt, i) => (
                        <span key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300">
                          {opt}
                          <button 
                            type="button"
                            onClick={() => setNewField({...newField, options: newField.options?.filter((_, idx) => idx !== i)})}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                  <input 
                    type="checkbox" 
                    id="required"
                    checked={newField.required}
                    onChange={(e) => setNewField({...newField, required: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/5 border-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="required" className="text-xs font-bold text-slate-400">حقل إلزامي (يجب تعبئته عند التسجيل)</label>
                </div>

                <div className="flex gap-4 pt-10">
                  <button onClick={handleAddField} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all uppercase tracking-[4px]">تأكيد الإضافة</button>
                  <button onClick={() => setIsAddingField(false)} className="flex-1 py-5 glass bg-white/5 text-slate-500 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-[4px]">إلغاء</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
