import React, { useState } from 'react';
import { Bot, Sparkles, AlertCircle, Send, Clipboard, Brain, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { cn } from '../../lib/utils';

export default function AIDiagnosisAssistant() {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.suggestDiagnosis(symptoms.split(','));
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-end gap-3">
            <Sparkles className="text-amber-400" /> مساعد التشخيص الذكي
          </h2>
          <p className="text-sm text-sky-400/70 border-r-4 border-sky-600 pr-4 mt-2 font-bold italic">دعم اتخاذ القرار الطبي باستخدام تقنيات الذكاء الاصطناعي (Gemini 3)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Clipboard size={24} />
               </div>
               <h3 className="font-black text-white">وصف الأعراض أو الحالة</h3>
            </div>
            
            <textarea 
              className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:border-indigo-500/50 transition-all font-bold resize-none"
              placeholder="مثال: صداع نصفي حاد، غثيان، حساسية من الضوء، مستمر منذ 3 أيام..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <button 
              onClick={handleAnalyze}
              disabled={loading || !symptoms.trim()}
              className={cn(
                "w-full mt-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all",
                loading ? "bg-white/10 text-slate-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
              )}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Brain size={20} /> تحليل الحالة واقتراح التشخيص
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                 <AlertCircle size={18} /> {error}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4 text-amber-500/70">
             <AlertCircle className="shrink-0" />
             <p className="text-xs font-bold leading-relaxed">
                تنبيه: هذا المساعد مقدم لأغراض استرشادية فقط لدعم الكادر الطبي. لا يجب الاعتماد عليه كبديل للخبرة السريرية المهنية أو التشخيص البشري المعتمد.
             </p>
          </div>
        </div>

        {/* Output Area */}
        <div className="glass p-8 rounded-[40px] border border-white/5 min-h-[400px] flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6 relative z-10">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Stethoscope size={24} />
             </div>
             <h3 className="font-black text-white">النتائج والاقتراحات</h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-invert max-w-none prose-p:font-bold prose-p:text-slate-300 prose-headings:text-white"
                >
                  <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-bold">
                    {analysis}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-30 select-none">
                  <Bot size={64} className="mb-4" />
                  <p className="text-xl font-black tracking-widest uppercase italic">Waiting for Input</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {analysis && (
            <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
               <button className="flex-1 py-3 glass bg-white/5 text-slate-400 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">
                  نسخ التحليل للسجل
               </button>
               <button className="flex-1 py-3 glass bg-white/5 text-slate-400 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">
                  طباعة التقرير
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
