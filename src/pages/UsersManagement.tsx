import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, User, Shield, Key, Trash2, Edit2, 
  Check, X, ShieldCheck, Mail, Briefcase, 
  Activity, MoreVertical, Lock, Unlock, 
  Settings, UserPlus, Fingerprint, Calendar,
  History, ShieldAlert, LayoutGrid, LayoutDashboard,
  FileHeart, CalendarDays, ListOrdered, ClipboardList,
  MessageSquare, Stethoscope, UsersRound, Building2,
  FlaskConical, Pill, Image as ImageIcon, BarChart3,
  Receipt, Sparkles, Bed
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Permission, AuditLog } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const ROLES: UserType['role'][] = ['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'receptionist'];
const PERMISSIONS: Permission[] = ['all', 'read_only', 'clinical', 'pharmacy', 'lab', 'admin', 'registration', 'billing'];

const ROLE_PERMISSIONS: Record<UserType['role'], Permission[]> = {
  admin: ['all'],
  doctor: ['clinical', 'read_only'],
  nurse: ['clinical', 'registration'],
  pharmacist: ['pharmacy', 'read_only'],
  lab_tech: ['lab', 'read_only'],
  receptionist: ['registration', 'billing', 'read_only']
};

const ROLE_LABELS: Record<UserType['role'], string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  nurse: 'ممرض',
  pharmacist: 'صيدلاني',
  lab_tech: 'فني مختبر',
  receptionist: 'استقبال'
};

const ROLE_COLORS: Record<UserType['role'], { bg: string; border: string; text: string; dot: string }> = {
  admin:        { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    dot: 'bg-rose-500' },
  doctor:       { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-400',     dot: 'bg-sky-500' },
  nurse:        { bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    text: 'text-teal-400',    dot: 'bg-teal-500' },
  pharmacist:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  lab_tech:     { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  text: 'text-indigo-400',  dot: 'bg-indigo-500' },
  receptionist: { bg: 'bg-slate-500/10',   border: 'border-slate-500/30',   text: 'text-slate-400',   dot: 'bg-slate-500' }
};

const PERMISSION_LABELS: Record<Permission, { label: string; desc: string }> = {
  all:          { label: 'وصول مطلق',      desc: 'التحكم الكامل بجميع أقسام النظام' },
  read_only:    { label: 'قراءة فقط',       desc: 'مشاهدة البيانات دون صلاحية التعديل' },
  clinical:     { label: 'العيادة',         desc: 'السجلات السريرية، الزيارات، والتشخيص' },
  pharmacy:     { label: 'الصيدلية',        desc: 'صرف الأدوية وإدارة مخزن الصيدلية' },
  lab:          { label: 'المختبر',         desc: 'إدارة تحاليل المختبر وإدخال النتائج' },
  admin:        { label: 'الإدارة',         desc: 'الأدلة والإعدادات ولوحة التقارير' },
  registration: { label: 'التسجيل',         desc: 'تسجيل المرضى وإدارة المواعيد' },
  billing:      { label: 'المالية',         desc: 'سندات الاستعلامات والتحصيل المالي' }
};

type SystemModule = {
  icon: any;
  label: string;
  path: string;
  requiredPerms: Permission[];
};

const SYSTEM_MODULES: SystemModule[] = [
  { icon: LayoutDashboard,  label: 'لوحة التحكم',          path: '/',                         requiredPerms: ['all'] },
  { icon: FileHeart,        label: 'إدارة المرضى (EMR)',    path: '/patients',                  requiredPerms: ['clinical', 'registration'] },
  { icon: CalendarDays,     label: 'المواعيد والحجوزات',    path: '/appointments',              requiredPerms: ['clinical', 'registration'] },
  { icon: ListOrdered,      label: 'قائمة الانتظار',        path: '/queue',                    requiredPerms: ['clinical', 'registration'] },
  { icon: ClipboardList,    label: 'أرشيف الزيارات',        path: '/clinical-visits',           requiredPerms: ['clinical'] },
  { icon: MessageSquare,    label: 'محادثات الموظفين',       path: '/chat',                     requiredPerms: ['all'] },
  { icon: Sparkles,         label: 'مساعد التشخيص الذكي',   path: '/diagnosis-assistant',      requiredPerms: ['clinical'] },
  { icon: Pill,             label: 'الصيدلية والمخزن',       path: '/pharmacy',                 requiredPerms: ['pharmacy'] },
  { icon: FlaskConical,     label: 'المختبرات والتحاليل',    path: '/laboratory',               requiredPerms: ['lab'] },
  { icon: ImageIcon,        label: 'الأشعة والتصوير',        path: '/radiology',                requiredPerms: ['clinical'] },
  { icon: Bed,              label: 'إدارة الرقود',           path: '/inpatient',                requiredPerms: ['clinical'] },
  { icon: Stethoscope,      label: 'دليل الأطباء',           path: '/directories/doctors',      requiredPerms: ['admin'] },
  { icon: UsersRound,       label: 'دليل الممرضين',          path: '/directories/nurses',       requiredPerms: ['admin'] },
  { icon: Building2,        label: 'دليل الأقسام',           path: '/directories/departments',  requiredPerms: ['admin'] },
  { icon: FlaskConical,     label: 'دليل بنود المختبر',       path: '/directories/lab',          requiredPerms: ['admin'] },
  { icon: Pill,             label: 'دليل أصناف الصيدلية',    path: '/directories/pharmacy',     requiredPerms: ['admin'] },
  { icon: Receipt,          label: 'سندات الاستعلامات',      path: '/transactions/receipts',    requiredPerms: ['billing', 'admin'] },
  { icon: BarChart3,        label: 'نسب الأطباء',            path: '/reports/doctor-commissions', requiredPerms: ['admin'] },
  { icon: Settings,         label: 'إعدادات النظام',          path: '/settings',                 requiredPerms: ['admin'] },
];

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'permissions'>('users');
  const [rolePerms, setRolePerms] = useState<Record<UserType['role'], Permission[]>>({ ...ROLE_PERMISSIONS });
  const [permsSaved, setPermsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Real-time users sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time logs sync
  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(15));
    const unsub = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(logsData);
    });
    return () => unsub();
  }, []);

  const [formState, setFormState] = useState<Partial<UserType>>({
    username: '',
    email: '',
    name: '',
    role: 'receptionist',
    permissions: ['read_only'],
    status: 'active'
  });

  const createAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        id: `LOG-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.username || !formState.name) return;

    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: formState.name,
          role: formState.role,
          permissions: formState.permissions,
          status: formState.status
        });
        await createAuditLog('تحديث مستخدم', `تم تحديث بيانات المستخدم ${formState.name}`);
      } else {
        const id = `user_${Date.now()}`;
        await setDoc(doc(db, 'users', id), {
          ...formState,
          id,
          createdAt: new Date().toISOString()
        });
        await createAuditLog('إنشاء مستخدم', `تم إنشاء حساب جديد لـ ${formState.name}`);
      }
      setShowAddModal(false);
      setEditingUser(null);
      setFormState({ username: '', email: '', name: '', role: 'receptionist', permissions: ['read_only'], status: 'active' });
    } catch (error) {
      console.error("Save failed", error);
      alert('فشلت العملية. تأكد من الصلاحيات.');
    }
  };

  const toggleStatus = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      alert('لا يمكنك تعطيل حسابك الخاص');
      return;
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'users', user.id), { status: newStatus });
    await createAuditLog('تغيير حالة', `تم تغيير حالة ${user.name} إلى ${newStatus === 'active' ? 'نشط' : 'معطل'}`);
  };

  const handleDelete = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الخاص');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المستخدم ${user.name}؟`)) return;
    
    await deleteDoc(doc(db, 'users', user.id));
    await createAuditLog('حذف مستخدم', `تم حذف المستخدم ${user.name}`);
  };

  const getRoleBadge = (role: string) => {
    const themes: Record<string, string> = {
      admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      doctor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      nurse: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      pharmacist: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      lab_tech: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      receptionist: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    };
    const labels: Record<string, string> = {
      admin: 'مدير نظام', doctor: 'طبيب', nurse: 'ممرض',
      pharmacist: 'صيدلاني', lab_tech: 'فني مختبر', receptionist: 'استقبال'
    };
    return (
      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", themes[role] || themes.receptionist)}>
        {labels[role] || role}
      </span>
    );
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen space-y-8 lg:p-6 text-right pb-20">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-right">إدارة الهوية والوصول</h1>
          </div>
          <p className="text-slate-400 font-medium max-w-md bg-white/5 p-3 rounded-xl border border-white/5 text-right">
            تحكم كامل في موظفي المركز، صلاحيات الوصول، وسجلات النشاط الأمني.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 no-print flex-wrap">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'users' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <User size={18} />
            المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'permissions' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <LayoutGrid size={18} />
            مصفوفة الصلاحيات
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'activity' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Activity size={18} />
            النشاط الأمني
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'permissions' ? (
          <motion.div
            key="permissions-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Role cards summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {ROLES.map(role => {
                const c = ROLE_COLORS[role];
                const perms = rolePerms[role];
                const count = users.filter(u => u.role === role).length;
                return (
                  <div key={role} className={cn("glass rounded-3xl p-5 border text-center space-y-3", c.border)}>
                    <div className={cn("w-10 h-10 rounded-2xl mx-auto flex items-center justify-center", c.bg)}>
                      <Shield size={20} className={c.text} />
                    </div>
                    <div>
                      <p className={cn("font-black text-sm", c.text)}>{ROLE_LABELS[role]}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{count} مستخدم</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {perms.map(p => (
                        <span key={p} className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase border", c.bg, c.border, c.text)}>
                          {PERMISSION_LABELS[p]?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Permissions matrix table */}
            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-3 text-right">
                  <div className="p-2 bg-indigo-600/20 rounded-xl"><LayoutGrid className="text-indigo-400" size={20} /></div>
                  <div>
                    <h3 className="font-black text-white text-base">مصفوفة الصلاحيات حسب الدور</h3>
                    <p className="text-slate-500 text-[10px] font-mono">انقر على أي خلية لتفعيل أو إلغاء الصلاحية للدور المقابل</p>
                  </div>
                </div>
                <button
                  onClick={() => { setRolePerms({ ...ROLE_PERMISSIONS }); setPermsSaved(false); }}
                  className="px-4 py-2 glass text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10"
                >
                  إعادة تعيين
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[700px]">
                  <thead>
                    <tr className="bg-[#0f172a] border-b border-white/5">
                      <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest w-56">الصلاحية</th>
                      {ROLES.map(role => {
                        const c = ROLE_COLORS[role];
                        return (
                          <th key={role} className="px-4 py-4 text-center">
                            <div className={cn("inline-flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl border", c.bg, c.border)}>
                              <div className={cn("w-2 h-2 rounded-full", c.dot)} />
                              <span className={cn("text-[10px] font-black whitespace-nowrap", c.text)}>{ROLE_LABELS[role]}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {PERMISSIONS.map((perm, pi) => (
                      <motion.tr
                        key={perm}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pi * 0.04 }}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <p className="font-black text-white text-sm">{PERMISSION_LABELS[perm]?.label}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{PERMISSION_LABELS[perm]?.desc}</p>
                          </div>
                        </td>
                        {ROLES.map(role => {
                          const c = ROLE_COLORS[role];
                          const hasIt = rolePerms[role].includes(perm);
                          const isAll = rolePerms[role].includes('all');
                          const grantedByAll = perm !== 'all' && isAll;
                          return (
                            <td key={role} className="px-4 py-4 text-center">
                              <button
                                onClick={() => {
                                  if (grantedByAll) return;
                                  setRolePerms(prev => {
                                    const cur = prev[role];
                                    const next = cur.includes(perm)
                                      ? cur.filter(p => p !== perm)
                                      : [...cur, perm];
                                    return { ...prev, [role]: next };
                                  });
                                  setPermsSaved(false);
                                }}
                                title={grantedByAll ? 'ممنوح بواسطة صلاحية الوصول المطلق' : hasIt ? 'انقر لإلغاء' : 'انقر لتفعيل'}
                                className={cn(
                                  "w-9 h-9 rounded-xl mx-auto flex items-center justify-center transition-all border-2",
                                  grantedByAll
                                    ? "bg-rose-500/10 border-rose-500/30 cursor-default"
                                    : hasIt
                                      ? cn("border-current shadow-lg hover:scale-110 active:scale-95", c.bg, c.border)
                                      : "bg-white/3 border-white/5 opacity-30 hover:opacity-70 hover:border-white/20"
                                )}
                              >
                                {grantedByAll
                                  ? <Key size={13} className="text-rose-400" />
                                  : hasIt
                                    ? <Check size={14} className={cn(c.text)} strokeWidth={3} />
                                    : <X size={12} className="text-slate-600" />
                                }
                              </button>
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-8 py-4 bg-white/3 border-t border-white/5 flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-6 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/40 inline-flex items-center justify-center"><Check size={9} className="text-indigo-400" /></span> صلاحية مفعّلة</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-rose-500/10 border border-rose-500/30 inline-flex items-center justify-center"><Key size={9} className="text-rose-400" /></span> ممنوح بالوصول المطلق</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-white/3 border border-white/10 inline-flex items-center justify-center"><X size={9} className="text-slate-600" /></span> غير مفعّل</span>
                </div>
                <button
                  onClick={() => setPermsSaved(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {permsSaved ? <><Check size={16} /> تم الحفظ</> : <><Shield size={16} /> حفظ الإعدادات</>}
                </button>
              </div>
            </div>

            {/* Module access matrix */}
            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex items-center gap-3 flex-row-reverse">
                <div className="p-2 bg-sky-600/20 rounded-xl"><LayoutDashboard className="text-sky-400" size={20} /></div>
                <div className="text-right">
                  <h3 className="font-black text-white text-base">أقسام النظام المتاحة لكل دور</h3>
                  <p className="text-slate-500 text-[10px] font-mono">يتم حساب الوصول تلقائياً بناءً على الصلاحيات المُعيّنة أعلاه</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[700px]">
                  <thead>
                    <tr className="bg-[#0f172a] border-b border-white/5">
                      <th className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest w-64">القسم / الوحدة</th>
                      {ROLES.map(role => {
                        const c = ROLE_COLORS[role];
                        return (
                          <th key={role} className="px-4 py-3 text-center">
                            <span className={cn("text-[10px] font-black", c.text)}>{ROLE_LABELS[role]}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {SYSTEM_MODULES.map((mod, mi) => {
                      const Icon = mod.icon;
                      return (
                        <motion.tr
                          key={mod.path}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: mi * 0.025 }}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3 flex-row-reverse">
                              <div className="p-2 glass rounded-xl border border-white/5">
                                <Icon size={14} className="text-slate-400" />
                              </div>
                              <span className="text-sm font-bold text-slate-300">{mod.label}</span>
                            </div>
                          </td>
                          {ROLES.map(role => {
                            const c = ROLE_COLORS[role];
                            const permsForRole = rolePerms[role];
                            const hasAccess = permsForRole.includes('all') ||
                              mod.requiredPerms.some(rp => permsForRole.includes(rp));
                            return (
                              <td key={role} className="px-4 py-3 text-center">
                                {hasAccess
                                  ? <div className={cn("w-7 h-7 rounded-xl mx-auto flex items-center justify-center", c.bg, "border", c.border)}>
                                      <Check size={13} className={c.text} strokeWidth={3} />
                                    </div>
                                  : <div className="w-7 h-7 rounded-xl mx-auto flex items-center justify-center bg-white/3 border border-white/5 opacity-25">
                                      <X size={11} className="text-slate-600" />
                                    </div>
                                }
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-user permissions summary */}
            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex items-center gap-3 flex-row-reverse">
                <div className="p-2 bg-emerald-600/20 rounded-xl"><User className="text-emerald-400" size={20} /></div>
                <div className="text-right">
                  <h3 className="font-black text-white text-base">صلاحيات المستخدمين المُخصَّصة</h3>
                  <p className="text-slate-500 text-[10px] font-mono">المستخدمون الذين يملكون صلاحيات تختلف عن افتراضي دورهم الوظيفي</p>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {users.length === 0
                  ? <div className="px-8 py-10 text-center text-slate-500 text-sm font-medium">لا توجد بيانات مستخدمين بعد</div>
                  : users.map((u, idx) => {
                      const c = ROLE_COLORS[u.role];
                      const defaultPerms = ROLE_PERMISSIONS[u.role] || [];
                      const isCustom = JSON.stringify([...u.permissions].sort()) !== JSON.stringify([...defaultPerms].sort());
                      return (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={cn("px-8 py-4 flex items-center justify-between flex-row-reverse hover:bg-white/[0.02] transition-colors", isCustom && "bg-amber-500/5")}
                        >
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border", c.bg, c.border, c.text)}>
                              {u.name ? u.name[0] : '?'}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white text-sm">{u.name}</p>
                              <p className="text-slate-500 text-[10px] font-mono">@{u.username} · <span className={c.text}>{ROLE_LABELS[u.role]}</span></p>
                            </div>
                            {isCustom && (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black rounded-full uppercase tracking-wider">
                                صلاحيات مخصصة
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            {u.permissions.map(p => (
                              <span key={p} className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase border", c.bg, c.border, c.text)}>
                                {PERMISSION_LABELS[p]?.label || p}
                              </span>
                            ))}
                            <button
                              onClick={() => { setEditingUser(u); setFormState(u); setShowAddModal(true); }}
                              className="p-2 glass text-slate-500 hover:text-sky-400 rounded-xl transition-all border border-white/5"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                }
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
             {/* Stats & Actions Row */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 glass p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-2 text-center">
                   <div className="text-3xl font-black text-white">{users.length}</div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">إجمالي الحسابات</div>
                </div>
                
                <div className="md:col-span-2 relative group">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، المعرف، أو الدور الوظيفي..."
                    className="w-full h-full bg-white/5 border border-white/10 rounded-3xl pr-12 pl-6 text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-right"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button 
                  onClick={() => {
                    setEditingUser(null);
                    setFormState({ username: '', email: '', name: '', role: 'receptionist', permissions: ['read_only'], status: 'active' });
                    setShowAddModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                >
                  <UserPlus size={20} />
                  إضافة مستخدم
                </button>
             </div>

             {/* Users Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((user, idx) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass rounded-3xl p-6 border border-white/10 group hover:border-indigo-500/50 transition-all relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={20} className="text-slate-500" />
                     </div>

                     <div className="flex items-start gap-4 flex-row-reverse">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl glass bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20">
                            {getInitials(user.name)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-4 border-[#0f172a] shadow-lg",
                            user.status === 'active' ? "bg-emerald-500" : "bg-slate-700"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                           <h3 className="font-bold text-white text-lg truncate mb-1">{user.name}</h3>
                           <div className="flex items-center justify-end gap-2 text-slate-500 text-xs font-mono">
                              <Fingerprint size={12} />
                              @{user.username}
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 flex flex-wrap gap-2 justify-end">
                        {getRoleBadge(user.role)}
                        {user.permissions.slice(0, 3).map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] text-indigo-300 font-bold border border-white/5">
                            {p}
                          </span>
                        ))}
                        {user.permissions.length > 3 && (
                          <span className="text-[9px] text-slate-500 px-2 py-0.5">+ {user.permissions.length - 3}</span>
                        )}
                     </div>

                     <div className="mt-8 flex items-center justify-between flex-row-reverse border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <Calendar size={12} />
                          <span>آخر دخول: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-YE') : '---'}</span>
                        </div>
                        
                        <div className="flex gap-2">
                           <button 
                            onClick={() => {
                              setEditingUser(user);
                              setFormState(user);
                              setShowAddModal(true);
                            }}
                            className="p-2 glass text-sky-400 hover:bg-sky-500 hover:text-white rounded-xl transition-all"
                            title="تعديل الحساب"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                            onClick={() => toggleStatus(user)}
                            className={cn(
                              "p-2 glass rounded-xl transition-all",
                              user.status === 'active' ? "text-rose-400 hover:bg-rose-500 hover:text-white" : "text-emerald-400 hover:bg-emerald-500 hover:text-white"
                            )}
                            title={user.status === 'active' ? "تعطيل الحساب" : "تفعيل الحساب"}
                           >
                             {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                           </button>
                           <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 glass text-slate-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="حذف الحساب"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="activity-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
          >
             <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between flex-row-reverse">
                <h3 className="font-bold text-white flex items-center gap-2">
                   <History className="text-indigo-400" size={20} />
                   سجل النشاط الأمني الأخير
                </h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-right">
                  <thead className="bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                     <tr>
                        <th className="px-8 py-4">الوقت والتاريخ</th>
                        <th className="px-8 py-4">المستخدم المنسق</th>
                        <th className="px-8 py-4">الإجراء</th>
                        <th className="px-8 py-4">التفاصيل</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/40">
                     {logs.map((log) => (
                       <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5 text-indigo-300 font-mono text-[10px]">
                             {new Date(log.timestamp).toLocaleString('ar-YE')}
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3 justify-end">
                                <span className="text-slate-300 text-xs font-bold">{log.userName}</span>
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                                   {log.userName ? log.userName[0] : '?'}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-2 py-0.5 rounded-lg bg-indigo-600 font-black text-white text-[9px] uppercase tracking-tighter shadow-lg shadow-indigo-600/20">
                                {log.action}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-slate-400 text-xs font-medium">
                             {log.details}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl glass bg-[#0f172a]/95 rounded-[40px] p-12 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]"
            >
              <div className="mb-10 flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-3xl font-black text-white border-r-4 border-indigo-500 pr-5 mb-2">
                    {editingUser ? 'تعديل الصلاحيات والمزايا' : 'إضافة موظف جديد للنظام'}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">قم بتحديد البيانات الأساسية ومستوى الوصول المناسب لكل فرد.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 glass rounded-full text-slate-500 hover:text-white hover:bg-rose-500 transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-right">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center justify-end gap-2 mb-6">
                          المعلومات الأساسية <User size={14}/>
                       </h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 flex items-center justify-end gap-2">
                               الاسم الكامل <span className="text-rose-500">*</span>
                             </label>
                             <input required className="w-full h-14 px-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-right" value={formState.name} onChange={(e) => setFormState({...formState, name: e.target.value})} placeholder="الاسم الكامل" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 text-right block">اسم المستخدم (username)</label>
                             <input required disabled={!!editingUser} className="w-full h-14 px-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed text-right" value={formState.username} onChange={(e) => setFormState({...formState, username: e.target.value})} placeholder="اسم المستخدم" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 text-right block">البريد الإلكتروني للعمل</label>
                          <div className="relative group">
                            <input type="email" required className="w-full h-14 pr-12 pl-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-mono text-right" value={formState.email} onChange={(e) => setFormState({...formState, email: e.target.value})} placeholder="staff@medical.com" />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 text-right block">الدور الوظيفي (التصنيف)</label>
                          <div className="relative">
                            <select 
                              className="w-full h-14 pr-12 pl-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 appearance-none font-black text-sm text-right" 
                              value={formState.role} 
                              onChange={(e) => {
                                const role = e.target.value as UserType['role'];
                                setFormState({
                                  ...formState, 
                                  role, 
                                  permissions: ROLE_PERMISSIONS[role] 
                                });
                              }}
                            >
                              {ROLES.map(role => (
                                <option key={role} value={role} className="bg-slate-900">
                                  {role === 'admin' ? 'مدير نظام كامل' : role === 'doctor' ? 'طبيب ممارس' : role === 'nurse' ? 'طاقم تمريض' : role === 'pharmacist' ? 'صيدلي' : role === 'lab_tech' ? 'فني مختبر' : 'موظف استقبال'}
                                </option>
                              ))}
                            </select>
                            <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between mb-6 flex-row-reverse">
                         <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                             مصفوفة الصلاحيات <Shield size={14}/>
                         </h4>
                         <div className="group relative">
                            <ShieldAlert size={14} className="text-slate-500 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 w-64 glass bg-[#0f172a] p-4 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10 text-[10px] leading-relaxed shadow-2xl">
                               <p className="font-bold text-indigo-400 mb-2 border-b border-white/5 pb-1 uppercase tracking-tighter text-right">دليل الصلاحيات</p>
                               <ul className="space-y-2 text-slate-400 text-right">
                                  <li><b className="text-white">وصول مطلق:</b> التحكم الكامل في النظام والإعدادات.</li>
                                  <li><b className="text-white">قراءة فقط:</b> مشاهدة البيانات دون تعديلها.</li>
                                  <li><b className="text-white">العيادة (Clinical):</b> الوصول للسجلات السريرية والتشخيص.</li>
                                  <li><b className="text-white">الصيدلية (Pharmacy):</b> صرف الأدوية وإدارة المخزن.</li>
                                  <li><b className="text-white">المختبر (Lab):</b> إدخال نتائج الفحوصات والتحاليل.</li>
                                  <li><b className="text-white">التسجيل (Registration):</b> إضافة المرضى وإدارة المواعيد.</li>
                               </ul>
                            </div>
                         </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {PERMISSIONS.map(perm => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => {
                                const current = formState.permissions || [];
                                const next = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
                                setFormState({ ...formState, permissions: next });
                              }}
                              className={cn(
                                "flex items-center justify-between flex-row-reverse px-6 py-4 rounded-2xl border-2 transition-all group",
                                formState.permissions?.includes(perm) 
                                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-xl shadow-indigo-500/10"
                                  : "glass border-white/5 text-slate-500 opacity-50 hover:opacity-100"
                              )}
                            >
                               <div className="flex flex-col items-end gap-1 text-right">
                                  <span className="text-xs font-black">{perm === 'all' ? 'وصول مطلق' : perm === 'read_only' ? 'للقراءة فقط' : perm === 'clinical' ? 'العيادة (Clinical)' : perm === 'pharmacy' ? 'الصيدلية (Pharmacy)' : perm === 'lab' ? 'المختبر (Lab)' : perm === 'admin' ? 'الإدارة (Admin)' : perm === 'registration' ? 'التسجيل (Registration)' : 'المالية (Billing)'}</span>
                                  <span className="text-[9px] opacity-60">صلاحية وصول لنظام ال{perm}</span>
                               </div>
                               <div className={cn(
                                 "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                 formState.permissions?.includes(perm) ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-700"
                               )}>
                                 {formState.permissions?.includes(perm) ? <Check size={14} strokeWidth={4}/> : <Plus size={14}/>}
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="pt-10 flex gap-4">
                       <button type="submit" className="flex-1 bg-indigo-600 text-white h-16 rounded-[20px] font-black text-sm shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all">
                          {editingUser ? 'حفظ التغييرات الأمنية' : 'تأكيد إنشاء الحساب'}
                       </button>
                       <button type="button" onClick={() => setShowAddModal(false)} className="px-10 glass bg-white/5 text-slate-400 h-16 rounded-[20px] font-bold hover:bg-white/10 hover:text-white transition-all">
                         إلغاء
                       </button>
                    </div>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
