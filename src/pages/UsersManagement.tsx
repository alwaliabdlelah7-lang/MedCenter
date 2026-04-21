import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Shield, Key, Trash2, Edit2, Check, X, ShieldCheck, Mail, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Permission } from '../types';
import { cn } from '../lib/utils';
import { dataStore } from '../services/dataService';

const ROLES: UserType['role'][] = ['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'receptionist'];
const PERMISSIONS: Permission[] = ['all', 'read_only', 'clinical', 'pharmacy', 'lab', 'admin'];

export default function UsersManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await dataStore.getAll<UserType>('users');
        if (usersData.length === 0) {
          const initialAdmin: UserType = {
            id: 'u-1',
            username: 'admin',
            name: 'المدير العام',
            role: 'admin',
            permissions: ['all'],
            status: 'active',
            lastLogin: new Date().toISOString()
          };
          setUsers([initialAdmin]);
        } else {
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Failed to load users", error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState<Partial<UserType>>({
    username: '',
    password: '',
    name: '',
    role: 'receptionist',
    permissions: ['read_only'],
    status: 'active'
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name) return;
    
    const user: UserType = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: newUser.username!,
      password: newUser.password!,
      name: newUser.name!,
      role: newUser.role as any,
      permissions: newUser.permissions as any,
      status: 'active'
    };
    
    await dataStore.addItem('users', user);
    setUsers([...users, user]);
    setShowAddModal(false);
    setNewUser({ username: '', password: '', name: '', role: 'receptionist', permissions: ['read_only'] });
  };

  const togglePermission = (perm: Permission) => {
    const current = newUser.permissions || [];
    if (current.includes(perm)) {
      setNewUser({ ...newUser, permissions: current.filter(p => p !== perm) });
    } else {
      setNewUser({ ...newUser, permissions: [...current, perm] });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'مدير نظام',
      doctor: 'طبيب',
      nurse: 'ممرض',
      pharmacist: 'صيدلاني',
      lab_tech: 'فني مختبر',
      receptionist: 'موظف استقبال'
    };
    return labels[role] || role;
  };

  const getPermissionLabel = (perm: string) => {
    const labels: Record<string, string> = {
      all: 'كامل الصلاحيات',
      read_only: 'قراءة فقط',
      clinical: 'عمليات سريرية',
      pharmacy: 'صيدلية',
      lab: 'مختبر',
      admin: 'إدارة الإعدادات'
    };
    return labels[perm] || perm;
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:p-4 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-sm text-indigo-300/70 border-r-4 border-indigo-500 pr-3 font-medium">التحكم في وصول الموظفين والأدوار الأمنية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن موظف..." 
              className="pr-10 pl-4 py-2 glass bg-white/5 text-white border border-white/10 rounded-xl focus:border-indigo-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-white/10">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
              <th className="px-8 py-5 text-right">الموظف / المعرف</th>
              <th className="px-8 py-5 text-right">الدور الوظيفي</th>
              <th className="px-8 py-5 text-right">نطاق الصلاحيات</th>
              <th className="px-8 py-5 text-right">الحالة / الدخول</th>
              <th className="px-8 py-5 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl glass bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                         <User size={20} />
                      </div>
                      <div>
                         <div className="font-bold text-white text-sm">{user.name}</div>
                         <div className="text-[10px] text-slate-500 font-mono tracking-tighter">@{user.username}</div>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                      <Briefcase size={14} />
                      {getRoleLabel(user.role)}
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex flex-wrap gap-1">
                      {user.permissions.map(p => (
                        <span key={p} className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold border border-indigo-500/20">
                           {getPermissionLabel(p)}
                        </span>
                      ))}
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full w-fit",
                        user.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                         {user.status === 'active' ? 'نشط' : 'معطل'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono italic">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-YE') : 'لم يسجل دخول'}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-sky-400 glass rounded-lg"><Key size={14} /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-400 glass rounded-lg" onClick={() => setUsers(users.filter(u => u.id !== user.id))}><Trash2 size={14} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl glass bg-[#0f172a]/95 rounded-3xl p-10 border border-white/10"
            >
              <h3 className="text-2xl font-bold mb-8 text-white border-r-4 border-indigo-500 pr-5">إضافة مستخدم جديد للنظام</h3>
              
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <User size={14}/> المعلومات الشخصية
                       </h4>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase italic">الاسم الكامل</label>
                          <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase italic">اسم المستخدم (المعرف)</label>
                          <input required className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 font-mono" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase italic">الدور الوظيفي</label>
                          <select className="w-full px-5 py-4 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 appearance-none font-bold" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}>
                            {ROLES.map(role => <option key={role} value={role} className="bg-slate-900">{getRoleLabel(role)}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <Shield size={14}/> إدارة الصلاحيات
                       </h4>
                       <div className="grid grid-cols-2 gap-3">
                          {PERMISSIONS.map(perm => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => togglePermission(perm)}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-xs font-bold",
                                newUser.permissions?.includes(perm) 
                                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10"
                                  : "glass border-white/10 text-slate-500 opacity-60 hover:opacity-100"
                              )}
                            >
                               {getPermissionLabel(perm)}
                               {newUser.permissions?.includes(perm) ? <ShieldCheck size={14}/> : <Shield size={14}/>}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="pt-10 flex gap-4">
                       <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-bold shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">إنشاء الحساب</button>
                       <button type="button" onClick={() => setShowAddModal(false)} className="px-10 glass bg-white/5 text-slate-400 py-5 rounded-3xl font-bold hover:bg-white/10 transition-colors">إلغاء</button>
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
