import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Lock, User, Activity, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface LoginFormState {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
}

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormState>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (isRegister) {
      if (!formData.name.trim()) {
        errors.name = 'الاسم الكامل مطلوب';
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'كلمات المرور غير متطابقة';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      if (isRegister) {
        await register(formData.email, formData.password, formData.name);
        setSuccessMessage('تم إنشاء الحساب بنجاح. يتم نقلك للصفحة الرئيسية...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        await login(formData.email, formData.password);
        setSuccessMessage('تم تسجيل الدخول بنجاح. يتم نقلك للصفحة الرئيسية...');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('خطأ في البريد الإلكتروني أو كلمة المرور');
      } else if (err.code === 'auth/invalid-email') {
        setError('يرجى إدخال بريد إلكتروني صحيح');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم حظر المحاولات مؤقتاً. يرجى المحاولة لاحقاً');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل مسبقاً');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً (حد أدنى 6 أحرف)');
      } else {
        setError('حدث خطأ أثناء الاتصال بالنظام. يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                <Activity size={40} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">نظام إيداع الطبي</h1>
                <p className="text-indigo-100 text-sm font-semibold mt-1">Medical Center Information System</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <p className="text-center text-slate-400 text-sm font-semibold mb-8">
              {isRegister ? 'إنشاء حساب جديد' : 'الدخول للنظام المركزي'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 text-right">
            {/* Full Name Field (Register Only) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-slate-300 block">الاسم الكامل</label>
                <div className="relative group">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full py-3 pr-12 pl-4 bg-white/5 border rounded-lg text-white outline-none transition-all font-medium ${
                      validationErrors.name 
                        ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
                        : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                    }`}
                    placeholder="محمد أحمد"
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.name}
                  </p>
                )}
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">البريد الإلكتروني</label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full py-3 pr-12 pl-4 bg-white/5 border rounded-lg text-white outline-none transition-all font-medium ${
                    validationErrors.email 
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
                      : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  }`}
                  placeholder="user@medcenter.com"
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full py-3 pr-12 pl-12 bg-white/5 border rounded-lg text-white outline-none transition-all font-medium ${
                    validationErrors.password 
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
                      : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Register Only) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-slate-300 block">تأكيد كلمة المرور</label>
                <div className="relative group">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full py-3 pr-12 pl-12 bg-white/5 border rounded-lg text-white outline-none transition-all font-medium ${
                      validationErrors.confirmPassword 
                        ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' 
                        : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </motion.div>
            )}

            {/* Form Helpers */}
            <div className="flex items-center justify-between pt-2">
              {!isRegister && (
                <button 
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                >
                  ليس لديك حساب؟ أنشئ واحد الآن
                </button>
              )}
              {isRegister && (
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setValidationErrors({});
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                >
                  لديك حساب؟ سجل دخولك
                </button>
              )}
              {!isRegister && (
                <span className="text-xs text-slate-500">التجربة: admin@medcenter.com / 123456</span>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="font-medium">{successMessage}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button 
              type="submit" 
              disabled={loading || !!successMessage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                isRegister ? 'إنشاء الحساب' : 'تسجيل الدخول'
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/5 px-3 text-xs text-slate-500 font-semibold">أو</span>
              </div>
            </div>

            {/* Google Login Button */}
            <motion.button 
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  await loginWithGoogle();
                  navigate('/');
                } catch (err: any) {
                  console.error("Google login error:", err);
                  setError('فشل تسجيل الدخول عبر جوجل');
                }
                setLoading(false);
              }}
              disabled={loading || !!successMessage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              تسجيل عبر Google
            </motion.button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-white/5 border-t border-white/10 px-8 py-6 text-center">
            <p className="text-xs text-slate-400 font-medium mb-1">نظام إدارة المراكز الطبية المتكاملة</p>
            <p className="text-xs text-slate-600">© 2026 شركة إيداع للحلول البرمجية</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
