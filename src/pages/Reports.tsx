import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity as ActivityIcon, FileText, Download } from 'lucide-react';
import { Receipt, Doctor } from '../types';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [receipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('hospital_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate stats
  const totalRevenue = receipts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPatients = receipts.length;
  const cashPayments = receipts.filter(r => r.paymentMethod === 'cash').reduce((acc, curr) => acc + curr.amount, 0);
  const creditPayments = totalRevenue - cashPayments;

  // Revenue by Doctor
  const doctorRevenueData = doctors.map(doc => {
    const revenue = receipts.filter(r => r.doctorId === doc.id).reduce((acc, curr) => acc + curr.amount, 0);
    const doctorShare = (revenue * (doc.percentage / 100));
    return {
      name: doc.name,
      revenue,
      doctorShare
    };
  }).filter(d => d.revenue > 0);

  // Payment Method Data
  const paymentData = [
    { name: 'نقدي', value: cashPayments },
    { name: 'آجل / تأمين', value: creditPayments },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">التقارير والإحصائيات</h2>
          <p className="text-sm text-slate-500">تحليل المبيعات والأداء المالي للمركز</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
          <Download size={18} />
          <span>تصدير PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-2xl mb-4"><DollarSign size={24} /></div>
          <p className="text-sm text-slate-500 font-medium">إجمالي الإيرادات</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{totalRevenue.toLocaleString()} <small className="text-xs font-normal text-slate-400">ر.ي</small></h3>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-3 bg-sky-50 text-sky-600 w-fit rounded-2xl mb-4"><Users size={24} /></div>
          <p className="text-sm text-slate-500 font-medium">عدد المراجعين</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{totalPatients} <small className="text-xs font-normal text-slate-400">مريض</small></h3>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-3 bg-orange-50 text-orange-600 w-fit rounded-2xl mb-4">< TrendingUp size={24} /></div>
          <p className="text-sm text-slate-500 font-medium">التحصيل النقدي</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{cashPayments.toLocaleString()} <small className="text-xs font-normal text-slate-400">ر.ي</small></h3>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-3 bg-purple-50 text-purple-600 w-fit rounded-2xl mb-4"><FileText size={24} /></div>
          <p className="text-sm text-slate-500 font-medium">متوسط قيمة السند</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(0) : 0} <small className="text-xs font-normal text-slate-400">ر.ي</small></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
          <h3 className="font-bold text-slate-800 mb-8 px-2 flex items-center gap-2">
             <ActivityIcon size={20} className="text-sky-500" />
             إيرادات الأطباء ونسبهم
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} width={120} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={24} name="إجمالي الإيراد" />
                <Bar dataKey="doctorShare" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} name="نسبة الطبيب" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="glass-card p-8 rounded-3xl">
          <h3 className="font-bold text-slate-800 mb-8 text-center">طرق الدفع</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
             {paymentData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-sm font-bold text-slate-600">{item.name}</span>
                 </div>
                 <span className="text-sm font-black text-slate-800">{item.value.toLocaleString()} ر.ي</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
