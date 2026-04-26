import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Lock, User, Activity, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass bg-slate-900/60 p-10 rounded-[40px] border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 mb-6 group cursor-pointer overflow-hidden relative">
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               <Activity size={40} className="text-white relative z-10" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 italic">نظام ايداع الطبي</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Hospital Information System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-right">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] pr-2 italic">اسم المستخدم</label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  required
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-4 pr-12 pl-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                  placeholder="alwaliabdlelah7@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] pr-2 italic">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 pr-12 pl-6 glass bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[25px] font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all text-lg uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'تسجيل الدخول للنظام'
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold italic">أو عبر</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await loginWithGoogle();
                  navigate('/');
                } catch (err) {
                  setError('فشل تسجيل الدخول عبر جوجل');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-4 bg-white text-slate-900 rounded-[25px] font-black shadow-xl hover:bg-slate-100 active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              الدخول عبر حساب جوجل
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[2px]">نظام متكامل لإدارة المنشآت الطبية الحديثة</p>
            <p className="text-[9px] text-slate-700 mt-2 italic">© 2026 جميع الحقوق محفوظة لشركة ايداع للحلول البرمجية</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
