# نظام إدارة المنشآت الطبية المتكامل (MedCenter-HIS) 🏥

نظام إلكتروني حديث ومتكامل ومحترف لإدارة المستشفيات والمراكز الطبية (HIS)، مصمم بأحدث التقنيات لضمان الفعالية، الدقة، والأمان في العمليات الطبية والإدارية.

---

## 🌟 المميزات الرئيسية (Core Features)

### 1. إدارة المرضى (EMR) 📁
* سجل طبي إلكتروني شامل لكل مريض.
* متابعة التاريخ المرضي والزيارات السابقة.
* نظام حقول ديناميكية لتخصيص بيانات المرضى حسب تخصص المنشأة.

### 2. المختبرات والتحاليل الطبية (Lab Management) 🧪
* إدارة قوية لطلبات الفحوصات وإدخال النتائج.
* إدخال النتائج بنظام "الباراميترات التفصيلية" مع الوحدات والمجالات الطبيعية.
* دليل شامل للفحوصات المخبرية بأسعارها وتصنيفاتها.

### 3. الصيدلية والمخزن الدوائي (Pharmacy POS) 💊
* نقطة بيع (POS) متكاملة لصرف الأدوية.
* تحديث تلقائي للمخزون (Inventory Sync).
* تنبيهات ذكية للأدوية قاربت على النفاد أو الانتهاء.

### 4. الإدارة المالية والسندات (Financials) 💰
* إصدار سندات استعلامات فورية.
* طباعة سندات احترافية بصيغة PDF.
* تقارير يومية وأسبوعية عن الإيرادات والنسب المالية.

### 5. الصلاحيات والأمان (Security & RBAC) 🔒
* نظام تسجيل دخول مقيد.
* أدوار محددة: (مدير نظام، طبيب، ممرض، صيدلاني، فني مختبر، موظف استقبال).
* صلاحيات دقيقة لكل دور لمنع الوصول غير المصرح به للبيانات الحساسة.

---

## 🛠️ التقنيات المستخدمة (Technology Stack)

* **Frontend:** React 19, TypeScript
* **Styling:** Tailwind CSS (Modern Glassmorphism UI)
* **Routing:** React Router 7
* **Animations:** Framer Motion (motion/react)
* **Icons:** Lucide React
* **Build Tool:** Vite

---

## 🚀 تشغيل النظام (Getting Started)

### المتطلبات (Prerequisites)
* Node.js v18+ 
* npm or yarn

### التثبيت (Installation)
1. قم بتحميل المستودع:
   ```bash
   git clone https://github.com/alwaliabdlelah7-lang/MedCenter-HIS.git
   cd MedCenter-HIS
   ```
2. تثبيت المكاتب البرمجية:
   ```bash
   npm install
   ```
3. تشغيل النظام في بيئة التطوير:
   ```bash
   npm run dev
   ```

### البناء للنشر (Build for Production)
استخدم الأمر التالي لإنشاء ملفات النسخة النهائية:
```bash
npm run build
```
ستجد الملفات الجاهزة للنشر في مجلد `dist/`.

---

## 🛰️ المزامنة مع GitHub (GitHub Synchronization)

بما أنك تستخدم رابط الـ SSH الخاص بك، يمكنك مزامنة المشروع بالأوامر التالية:

```bash
# تهيئة المستودع المحلي إذا لم يكن موجوداً
git init

# إضافة الرابط البعيد (Remote URL)
git remote add origin git@github.com:alwaliabdlelah7-lang/MedCenter-HIS.git

# إضافة كافة الملفات للرفع
git add .
git commit -m "Initialize professional HIS system with complete modules"

# رفع التعديلات للفرع الرئيسي
git branch -M main
git push -u origin main
```

---

## 📁 هيكلية المشروع (Project Structure)

* `src/pages/`: صفحات النظام الأساسية (Clinic, Lab, Pharmacy, etc.)
* `src/pages/Directories/`: أدلة التهيئة (Doctors, Services, Medicines, etc.)
* `src/contexts/`: إدارة الجلسات والصلاحيات (AuthContext)
* `src/components/`: المكونات التفاعلية المشتركة.
* `src/types.ts`: تعريف البنى البرمجية (Types & Interfaces).

---

## 🤝 المساهمة (Contribution)
هذا النظام مفتوح للتطوير والمساهمة. يرجى فتح "Issue" قبل البدء بأي تغييرات جوهرية.

---

## ⚖️ الترخيص (License)
Apache-2.0 - جميع الحقوق محفوظة لشركة إيداع للحلول البرمجية © 2026.
