import { PharmacyItem, LabTest, Service, Doctor, Department, Clinic, Patient, Appointment } from '../types';

// ─── Master Lab Tests ────────────────────────────────────────────────────────
export const YEMEN_LAB_TESTS = [
  {
    id: 'mlt-0',
    name: 'فحص دم شامل (CBC)',
    price: 3500,
    category: 'دمويات',
    isProfile: true,
    parameters: [
      { id: 'cbc-1', name: 'WBC Count', unit: 'x10³/µL', normalRange: '4.0 - 11.0', minRange: 4.0, maxRange: 11.0, gender: 'both' },
      { id: 'cbc-2', name: 'RBC Count', unit: 'x10⁶/µL', normalRange: '4.5 - 5.5', minRange: 4.5, maxRange: 5.5, gender: 'male' },
      { id: 'cbc-3', name: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '13.5 - 17.5', minRange: 13.5, maxRange: 17.5, gender: 'male' },
      { id: 'cbc-4', name: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '12.0 - 15.5', minRange: 12.0, maxRange: 15.5, gender: 'female' },
      { id: 'cbc-5', name: 'Hematocrit (HCT)', unit: '%', normalRange: '40 - 52', minRange: 40, maxRange: 52, gender: 'male' },
      { id: 'cbc-6', name: 'MCV', unit: 'fL', normalRange: '80 - 100', minRange: 80, maxRange: 100, gender: 'both' },
      { id: 'cbc-7', name: 'Platelets (PLT)', unit: 'x10³/µL', normalRange: '150 - 450', minRange: 150, maxRange: 450, gender: 'both' },
    ],
  },
  {
    id: 'mlt-1',
    name: 'سكر الدم العشوائي (RBS)',
    price: 1500,
    category: 'كيمياء حيوية',
    parameters: [
      { id: 'rbs-1', name: 'Random Blood Sugar', unit: 'mg/dL', normalRange: '70 - 140', minRange: 70, maxRange: 140, gender: 'both' },
    ],
  },
  {
    id: 'mlt-2',
    name: 'وظائف الكبد (LFT)',
    price: 8000,
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'lft-1', name: 'ALT (SGPT)', unit: 'U/L', normalRange: '0 - 41', minRange: 0, maxRange: 41, gender: 'both' },
      { id: 'lft-2', name: 'AST (SGOT)', unit: 'U/L', normalRange: '0 - 40', minRange: 0, maxRange: 40, gender: 'both' },
      { id: 'lft-3', name: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '40 - 129', minRange: 40, maxRange: 129, gender: 'both' },
      { id: 'lft-4', name: 'Bilirubin Total', unit: 'mg/dL', normalRange: '0.1 - 1.2', minRange: 0.1, maxRange: 1.2, gender: 'both' },
      { id: 'lft-5', name: 'Albumin', unit: 'g/dL', normalRange: '3.4 - 5.4', minRange: 3.4, maxRange: 5.4, gender: 'both' },
    ],
  },
  {
    id: 'mlt-3',
    name: 'وظائف الكلى (KFT)',
    price: 6500,
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'kft-1', name: 'Creatinine', unit: 'mg/dL', normalRange: '0.7 - 1.3', minRange: 0.7, maxRange: 1.3, gender: 'male' },
      { id: 'kft-2', name: 'Creatinine', unit: 'mg/dL', normalRange: '0.6 - 1.1', minRange: 0.6, maxRange: 1.1, gender: 'female' },
      { id: 'kft-3', name: 'Urea', unit: 'mg/dL', normalRange: '15 - 45', minRange: 15, maxRange: 45, gender: 'both' },
      { id: 'kft-4', name: 'Uric Acid', unit: 'mg/dL', normalRange: '3.5 - 7.2', minRange: 3.5, maxRange: 7.2, gender: 'male' },
    ],
  },
  {
    id: 'mlt-4',
    name: 'فحص الدهون (Lipid Profile)',
    price: 9000,
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'lipid-1', name: 'Cholesterol Total', unit: 'mg/dL', normalRange: '< 200', maxRange: 200, gender: 'both' },
      { id: 'lipid-2', name: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', maxRange: 150, gender: 'both' },
      { id: 'lipid-3', name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '> 40', minRange: 40, gender: 'both' },
      { id: 'lipid-4', name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '< 130', maxRange: 130, gender: 'both' },
    ],
  },
  {
    id: 'mlt-5',
    name: 'فحص حمى التيفوئيد (Widal)',
    price: 2500,
    category: 'أحياء دقيقة',
    parameters: [
      { id: 'widal-1', name: 'Salmonella Typhi O', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-2', name: 'Salmonella Typhi H', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-3', name: 'Salmonella Paratyphi A', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-4', name: 'Salmonella Paratyphi B', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
    ],
  },
  {
    id: 'mlt-6',
    name: 'فحص الملاريا (Malaria)',
    price: 2000,
    category: 'دمويات / أحياء دقيقة',
    parameters: [
      { id: 'mal-1', name: 'Malaria Parasite (BF)', unit: 'Result', normalRange: 'Not Seen', gender: 'both' },
      { id: 'mal-2', name: 'ICT Malaria (Ag)', unit: 'Result', normalRange: 'Negative', gender: 'both' },
    ],
  },
  {
    id: 'mlt-7',
    name: 'فحص الغدة الدرقية (TSH / T3 / T4)',
    price: 12000,
    category: 'هرمونات',
    isProfile: true,
    parameters: [
      { id: 'thy-1', name: 'TSH', unit: 'mIU/L', normalRange: '0.4 - 4.0', minRange: 0.4, maxRange: 4.0, gender: 'both' },
      { id: 'thy-2', name: 'Free T3', unit: 'pmol/L', normalRange: '3.1 - 6.8', minRange: 3.1, maxRange: 6.8, gender: 'both' },
      { id: 'thy-3', name: 'Free T4', unit: 'pmol/L', normalRange: '12 - 22', minRange: 12, maxRange: 22, gender: 'both' },
    ],
  },
  {
    id: 'mlt-8',
    name: 'فحص الهيموغلوبين السكري (HbA1c)',
    price: 5000,
    category: 'كيمياء حيوية',
    parameters: [
      { id: 'hba1c-1', name: 'HbA1c', unit: '%', normalRange: '4.0 - 5.6', minRange: 4.0, maxRange: 5.6, gender: 'both' },
    ],
  },
  {
    id: 'mlt-9',
    name: 'تحليل البول الكامل (Urine Analysis)',
    price: 2000,
    category: 'أمراض بولية',
    parameters: [
      { id: 'ua-1', name: 'Color', unit: '', normalRange: 'Yellow', gender: 'both' },
      { id: 'ua-2', name: 'pH', unit: '', normalRange: '4.5 - 8.0', minRange: 4.5, maxRange: 8.0, gender: 'both' },
      { id: 'ua-3', name: 'Protein', unit: '', normalRange: 'Negative', gender: 'both' },
      { id: 'ua-4', name: 'Glucose', unit: '', normalRange: 'Negative', gender: 'both' },
      { id: 'ua-5', name: 'WBC (Microscopy)', unit: 'cells/HPF', normalRange: '0 - 5', maxRange: 5, gender: 'both' },
      { id: 'ua-6', name: 'RBC (Microscopy)', unit: 'cells/HPF', normalRange: '0 - 2', maxRange: 2, gender: 'both' },
    ],
  },
];

// ─── Medicines ───────────────────────────────────────────────────────────────
export const YEMEN_MEDICINES: Partial<PharmacyItem>[] = [
  { id: 'mm-0', name: 'أوجمنتين (Augmentin) 625mg', tradeName: 'Augmentin', scientificName: 'Amoxicillin/Clavulanate', category: 'مضادات حيوية', price: 4500, stock: 120 },
  { id: 'mm-1', name: 'بنادول (Panadol) 500mg', tradeName: 'Panadol', scientificName: 'Paracetamol', category: 'مسكنات', price: 1200, stock: 300 },
  { id: 'mm-2', name: 'فولتارين (Voltaren) 50mg', tradeName: 'Voltaren', scientificName: 'Diclofenac Sodium', category: 'مسكنات ومضادات التهاب', price: 2500, stock: 80 },
  { id: 'mm-3', name: 'جلوكوفاج (Glucophage) 500mg', tradeName: 'Glucophage', scientificName: 'Metformin HCl', category: 'أدوية السكري', price: 3000, stock: 150 },
  { id: 'mm-4', name: 'كونكور (Concor) 5mg', tradeName: 'Concor', scientificName: 'Bisoprolol Fumarate', category: 'أدوية الضغط', price: 4200, stock: 90 },
  { id: 'mm-5', name: 'بروفين (Brufen) 400mg', tradeName: 'Brufen', scientificName: 'Ibuprofen', category: 'مسكنات', price: 1800, stock: 200 },
  { id: 'mm-6', name: 'فينتولين (Ventolin) Inhaler', tradeName: 'Ventolin', scientificName: 'Salbutamol', category: 'أدوية الجهاز التنفسي', price: 3500, stock: 60 },
  { id: 'mm-7', name: 'أوميبرازول (Omeprazole) 20mg', tradeName: 'Losec', scientificName: 'Omeprazole', category: 'أدوية المعدة', price: 2200, stock: 180 },
  { id: 'mm-8', name: 'أملور (Amlor) 5mg', tradeName: 'Amlor', scientificName: 'Amlodipine Besylate', category: 'أدوية الضغط', price: 5500, stock: 70 },
  { id: 'mm-9', name: 'إنسولين ميكستارد 30/70', tradeName: 'Mixtard 30', scientificName: 'Insulin Isophane/Regular', category: 'أدوية السكري', price: 7500, stock: 40 },
  { id: 'mm-10', name: 'أموكسيسيلين (Amoxicillin) 500mg', tradeName: 'Amoxil', scientificName: 'Amoxicillin Trihydrate', category: 'مضادات حيوية', price: 2800, stock: 160 },
  { id: 'mm-11', name: 'سيبروفلوكساسين (Ciprofloxacin) 500mg', tradeName: 'Ciprobay', scientificName: 'Ciprofloxacin HCl', category: 'مضادات حيوية', price: 3200, stock: 100 },
  { id: 'mm-12', name: 'أتورفاستاتين (Atorvastatin) 20mg', tradeName: 'Lipitor', scientificName: 'Atorvastatin Calcium', category: 'أدوية الكوليسترول', price: 6000, stock: 85 },
  { id: 'mm-13', name: 'ديكلوفيناك أمبول (Diclofenac) 75mg', tradeName: 'Voltaren Inj', scientificName: 'Diclofenac Sodium', category: 'مسكنات حقن', price: 800, stock: 200 },
  { id: 'mm-14', name: 'ميتوكلوبراميد (Maxolon) 10mg', tradeName: 'Maxolon', scientificName: 'Metoclopramide', category: 'أدوية الغثيان', price: 1500, stock: 120 },
  { id: 'mm-15', name: 'لوراتادين (Claritin) 10mg', tradeName: 'Claritin', scientificName: 'Loratadine', category: 'مضادات الحساسية', price: 2000, stock: 140 },
  { id: 'mm-16', name: 'بنزيل بنسلين (Penicillin G) 1MU', tradeName: 'Pfizerpen', scientificName: 'Benzylpenicillin', category: 'مضادات حيوية حقن', price: 1200, stock: 90 },
  { id: 'mm-17', name: 'دكسامثازون (Dexamethasone) 4mg/2ml', tradeName: 'Dexamed', scientificName: 'Dexamethasone', category: 'كورتيزون حقن', price: 1800, stock: 110 },
  { id: 'mm-18', name: 'ميتفورمين (Metformin) 850mg', tradeName: 'Glucophage XR', scientificName: 'Metformin HCl', category: 'أدوية السكري', price: 3500, stock: 130 },
  { id: 'mm-19', name: 'أزيثرومايسين (Azithromycin) 500mg', tradeName: 'Zithromax', scientificName: 'Azithromycin Dihydrate', category: 'مضادات حيوية', price: 5000, stock: 75 },
];

// ─── Services ─────────────────────────────────────────────────────────────────
export const YEMEN_SERVICES: Partial<Service>[] = [
  { id: 'svc-0', name: 'معاينة طبيب عام', price: 3000 },
  { id: 'svc-1', name: 'معاينة طبيب أخصائي', price: 6000 },
  { id: 'svc-2', name: 'معاينة طبيب استشاري', price: 10000 },
  { id: 'svc-3', name: 'ضرب إبرة (عضل/وريد)', price: 500 },
  { id: 'svc-4', name: 'تغيير جروح بسيط', price: 2000 },
  { id: 'svc-5', name: 'تغيير جروح كبير', price: 5000 },
  { id: 'svc-6', name: 'تركيب كانيولا', price: 1000 },
  { id: 'svc-7', name: 'قياس ضغط وسكر', price: 500 },
  { id: 'svc-8', name: 'تخطيط قلب (ECG)', price: 4000 },
  { id: 'svc-9', name: 'بخار (Nebulizer)', price: 2000 },
  { id: 'svc-10', name: 'جبيرة (Splint)', price: 5000 },
  { id: 'svc-11', name: 'غسيل أذن', price: 1500 },
  { id: 'svc-12', name: 'إزالة خياطة', price: 1500 },
  { id: 'svc-13', name: 'تنظيف جروح وتعقيم', price: 3000 },
];

// ─── Departments ──────────────────────────────────────────────────────────────
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'الباطنية', description: 'قسم الأمراض الباطنية والمزمنة' },
  { id: 'dept-2', name: 'الأطفال', description: 'قسم طب الأطفال والخدج' },
  { id: 'dept-3', name: 'الجراحة العامة', description: 'قسم الجراحة العامة والطوارئ الجراحية' },
  { id: 'dept-4', name: 'النساء والولادة', description: 'قسم أمراض النساء والتوليد' },
  { id: 'dept-5', name: 'القلب والأوعية', description: 'مركز أمراض وجراحة القلب والأوعية الدموية' },
  { id: 'dept-6', name: 'الأسنان', description: 'مركز جراحة وتجميل الأسنان' },
  { id: 'dept-7', name: 'العظام والمفاصل', description: 'قسم جراحة العظام والمفاصل والعمود الفقري' },
  { id: 'dept-8', name: 'الأنف والأذن والحنجرة', description: 'قسم أمراض الأنف والأذن والحنجرة' },
  { id: 'dept-9', name: 'العيون', description: 'مركز طب وجراحة العيون' },
  { id: 'dept-10', name: 'الجلدية والتجميل', description: 'قسم أمراض الجلد والتجميل والليزر' },
];

// ─── Clinics ──────────────────────────────────────────────────────────────────
export const INITIAL_CLINICS: Clinic[] = [
  { id: 'c-1', name: 'عيادة الباطنية 1 — د. أحمد الوالي', departmentId: 'dept-1', doctorIds: ['d-1'] },
  { id: 'c-2', name: 'عيادة الأطفال — د. سارة محمد', departmentId: 'dept-2', doctorIds: ['d-2'] },
  { id: 'c-3', name: 'عيادة الجراحة — د. خالد صالح', departmentId: 'dept-3', doctorIds: ['d-3'] },
  { id: 'c-4', name: 'عيادة النساء والولادة — د. مريم العمري', departmentId: 'dept-4', doctorIds: ['d-4'] },
  { id: 'c-5', name: 'عيادة القلب — د. يوسف المقطري', departmentId: 'dept-5', doctorIds: ['d-5'] },
  { id: 'c-6', name: 'عيادة الأسنان — د. نور الحسيني', departmentId: 'dept-6', doctorIds: ['d-6'] },
  { id: 'c-7', name: 'عيادة العظام — د. فارس الشمري', departmentId: 'dept-7', doctorIds: ['d-7'] },
  { id: 'c-8', name: 'طوارئ عامة', departmentId: 'dept-3', doctorIds: ['d-3', 'd-8'] },
  { id: 'c-9', name: 'عيادة الباطنية 2 — د. ياسمين حمدان', departmentId: 'dept-1', doctorIds: ['d-9'] },
  { id: 'c-10', name: 'عيادة العيون — د. عمر الزبيدي', departmentId: 'dept-9', doctorIds: ['d-10'] },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'd-1', name: 'أحمد محمد الوالي', specialization: 'استشاري باطنية وسكري',
    phone: '777000001', mobile: '777000001', email: 'ahmed.alwali@medcenter.com',
    departmentId: 'dept-1', gender: 'male', percentage: 70,
    consultationFee: 8000, followupFee: 4000, returnDays: 7,
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    workingHours: { start: '08:00', end: '16:00' },
  },
  {
    id: 'd-2', name: 'سارة عبدالله محمد', specialization: 'أخصائية أطفال وحديثي الولادة',
    phone: '777000002', mobile: '777000002', email: 'sara.mohammed@medcenter.com',
    departmentId: 'dept-2', gender: 'female', percentage: 60,
    consultationFee: 5000, followupFee: 2500, returnDays: 3,
    workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'thursday'],
    workingHours: { start: '09:00', end: '16:00' },
  },
  {
    id: 'd-3', name: 'خالد صالح العمري', specialization: 'جراح عام واستئصال',
    phone: '777000003', mobile: '777000003', email: 'khalid.omari@medcenter.com',
    departmentId: 'dept-3', gender: 'male', percentage: 55,
    consultationFee: 7000, followupFee: 3500, returnDays: 5,
    workingDays: ['sunday', 'monday', 'wednesday', 'thursday'],
    workingHours: { start: '10:00', end: '20:00' },
  },
  {
    id: 'd-4', name: 'مريم أحمد العمري', specialization: 'استشارية نساء وتوليد',
    phone: '777000004', mobile: '777000004', email: 'mariam.omari@medcenter.com',
    departmentId: 'dept-4', gender: 'female', percentage: 65,
    consultationFee: 9000, followupFee: 4500, returnDays: 14,
    workingDays: ['saturday', 'sunday', 'tuesday', 'wednesday'],
    workingHours: { start: '08:00', end: '14:00' },
  },
  {
    id: 'd-5', name: 'يوسف ناصر المقطري', specialization: 'استشاري قلب وأوعية دموية',
    phone: '777000005', mobile: '777000005', email: 'yousuf.maqtari@medcenter.com',
    departmentId: 'dept-5', gender: 'male', percentage: 75,
    consultationFee: 12000, followupFee: 6000, returnDays: 30,
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    workingHours: { start: '11:00', end: '19:00' },
  },
  {
    id: 'd-6', name: 'نور فيصل الحسيني', specialization: 'طب وجراحة الأسنان',
    phone: '777000006', mobile: '777000006', email: 'nour.husseini@medcenter.com',
    departmentId: 'dept-6', gender: 'female', percentage: 50,
    consultationFee: 5000, followupFee: 3000, returnDays: 7,
    workingDays: ['saturday', 'monday', 'wednesday', 'thursday'],
    workingHours: { start: '09:00', end: '17:00' },
  },
  {
    id: 'd-7', name: 'فارس محمد الشمري', specialization: 'جراح عظام ومفاصل',
    phone: '777000007', mobile: '777000007', email: 'faris.shamri@medcenter.com',
    departmentId: 'dept-7', gender: 'male', percentage: 60,
    consultationFee: 8000, followupFee: 4000, returnDays: 21,
    workingDays: ['sunday', 'tuesday', 'thursday'],
    workingHours: { start: '14:00', end: '20:00' },
  },
  {
    id: 'd-8', name: 'عبدالرحمن علي القحطاني', specialization: 'طب طوارئ وحوادث',
    phone: '777000008', mobile: '777000008', email: 'abdulrahman.qahtani@medcenter.com',
    departmentId: 'dept-3', gender: 'male', percentage: 45,
    consultationFee: 4000, followupFee: 2000, returnDays: 2,
    workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '00:00', end: '23:59' },
  },
  {
    id: 'd-9', name: 'ياسمين محمود حمدان', specialization: 'باطنية وجهاز هضمي',
    phone: '777000009', mobile: '777000009', email: 'yasmine.hamdan@medcenter.com',
    departmentId: 'dept-1', gender: 'female', percentage: 60,
    consultationFee: 7000, followupFee: 3500, returnDays: 10,
    workingDays: ['saturday', 'sunday', 'monday', 'wednesday', 'thursday'],
    workingHours: { start: '15:00', end: '21:00' },
  },
  {
    id: 'd-10', name: 'عمر خالد الزبيدي', specialization: 'طب وجراحة العيون',
    phone: '777000010', mobile: '777000010', email: 'omar.zubaidi@medcenter.com',
    departmentId: 'dept-9', gender: 'male', percentage: 65,
    consultationFee: 8000, followupFee: 4000, returnDays: 14,
    workingDays: ['sunday', 'monday', 'tuesday', 'thursday'],
    workingHours: { start: '10:00', end: '18:00' },
  },
];

// ─── Patients ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

export const INITIAL_PATIENTS: Patient[] = [
  { id: 'p-1', name: 'عبدالله محمد ناصر الوالي', phone: '777123456', nationalId: '10234567', age: 45, gender: 'male', bloodType: 'O+', address: 'صنعاء — شارع الستين، مجمع التضامن', medicalHistory: ['ارتفاع ضغط الدم', 'سكري النوع الثاني', 'حساسية من البنسلين'], createdAt: daysAgo(120) },
  { id: 'p-2', name: 'فاطمة أحمد حسين القحطاني', phone: '777987654', nationalId: '10345678', age: 32, gender: 'female', bloodType: 'A-', address: 'عدن — المنصورة، حارة الجمهوري', medicalHistory: ['ربو قصبي', 'قصور تغذوي'], createdAt: daysAgo(90) },
  { id: 'p-3', name: 'صالح علي عبده الشمري', phone: '771223344', nationalId: '10456789', age: 58, gender: 'male', bloodType: 'B+', address: 'تعز — الحوبان، شارع المدينة', medicalHistory: ['سكري النوع الثاني', 'تضخم البروستاتا'], createdAt: daysAgo(60) },
  { id: 'p-4', name: 'نورة سالم بن طالب', phone: '773334455', nationalId: '10567890', age: 28, gender: 'female', bloodType: 'AB+', address: 'حضرموت — المكلا، شارع ساحل', medicalHistory: ['حساسية جلدية'], createdAt: daysAgo(45) },
  { id: 'p-5', name: 'أحمد ناصر المقطري', phone: '775556677', nationalId: '10678901', age: 40, gender: 'male', bloodType: 'O-', address: 'إب — مركز المدينة', medicalHistory: ['آلام الظهر المزمنة', 'ارتفاع الكوليسترول'], createdAt: daysAgo(30) },
  { id: 'p-6', name: 'مريم علي الحداد', phone: '776667788', nationalId: '10789012', age: 55, gender: 'female', bloodType: 'A+', address: 'الحديدة — السوق القديم', medicalHistory: ['قصور القلب الاحتقاني', 'ارتفاع ضغط الدم'], createdAt: daysAgo(25) },
  { id: 'p-7', name: 'عمر فيصل الحسني', phone: '771112233', nationalId: '10890123', age: 35, gender: 'male', bloodType: 'B-', address: 'صنعاء — حدة، شارع الأربعين', medicalHistory: ['صداع نصفي', 'نقص حديد'], createdAt: daysAgo(20) },
  { id: 'p-8', name: 'هند محمد الشرفي', phone: '772223344', nationalId: '10901234', age: 22, gender: 'female', bloodType: 'O+', address: 'مأرب — حي العمال', medicalHistory: [], createdAt: daysAgo(15) },
  { id: 'p-9', name: 'يحيى إبراهيم العواضي', phone: '774445566', nationalId: '11012345', age: 63, gender: 'male', bloodType: 'AB-', address: 'ذمار — وسط المدينة', medicalHistory: ['ارتفاع ضغط الدم', 'ضعف القلب', 'تليف كبد'], createdAt: daysAgo(10) },
  { id: 'p-10', name: 'خديجة سعيد الأسمري', phone: '778889900', nationalId: '11123456', age: 48, gender: 'female', bloodType: 'B+', address: 'صنعاء — مديرية السبعين', medicalHistory: ['انقطاع الطمث المبكر', 'هشاشة العظام'], createdAt: daysAgo(8) },
  { id: 'p-11', name: 'طارق نجيب المحمدي', phone: '775550011', nationalId: '11234567', age: 29, gender: 'male', bloodType: 'O+', address: 'عدن — التواهي', medicalHistory: ['حصوات كلى'], createdAt: daysAgo(7) },
  { id: 'p-12', name: 'زينب عبدالكريم الجابري', phone: '777660022', nationalId: '11345678', age: 37, gender: 'female', bloodType: 'A+', address: 'تعز — شارع جمال عبدالناصر', medicalHistory: ['انيميا', 'قرحة المعدة'], createdAt: daysAgo(6) },
  { id: 'p-13', name: 'محمد عبده اليافعي', phone: '771100033', nationalId: '11456789', age: 52, gender: 'male', bloodType: 'B+', address: 'لحج — الحوطة', medicalHistory: ['إصابة رياضية في الركبة'], createdAt: daysAgo(5) },
  { id: 'p-14', name: 'آمال حسن الربيعي', phone: '773300044', nationalId: '11567890', age: 41, gender: 'female', bloodType: 'O-', address: 'صنعاء — بيت بوس', medicalHistory: ['متلازمة المبيض المتعدد الكيسات', 'سكري الحمل'], createdAt: daysAgo(4) },
  { id: 'p-15', name: 'سامي علي القدسي', phone: '776600055', nationalId: '11678901', age: 19, gender: 'male', bloodType: 'A-', address: 'عمران — مركز المدينة', medicalHistory: ['كسر قديم في الساعد'], createdAt: daysAgo(3) },
  { id: 'p-16', name: 'وفاء إبراهيم المطري', phone: '772200066', nationalId: '11789012', age: 44, gender: 'female', bloodType: 'AB+', address: 'الحديدة — الحيمة البحرية', medicalHistory: ['ارتجاع معدي مريئي', 'تضخم الغدة الدرقية'], createdAt: daysAgo(3) },
  { id: 'p-17', name: 'فهد ناصر الغامدي', phone: '779900077', nationalId: '11890123', age: 66, gender: 'male', bloodType: 'O+', address: 'صنعاء — الصافية', medicalHistory: ['قصور كلوي مزمن', 'سكري', 'ضغط'], createdAt: daysAgo(2) },
  { id: 'p-18', name: 'ريم أحمد الأنيسي', phone: '774400088', nationalId: '11901234', age: 26, gender: 'female', bloodType: 'B-', address: 'تعز — صالة', medicalHistory: [], createdAt: daysAgo(2) },
  { id: 'p-19', name: 'عادل حمود الحربي', phone: '770011099', nationalId: '12012345', age: 34, gender: 'male', bloodType: 'A+', address: 'صنعاء — سنحان', medicalHistory: ['التهاب الكبد الوبائي B'], createdAt: daysAgo(1) },
  { id: 'p-20', name: 'سلمى علي الشمايلة', phone: '777222100', nationalId: '12123456', age: 30, gender: 'female', bloodType: 'O+', address: 'إب — جبلة', medicalHistory: ['حساسية من الغبار', 'ربو خفيف'], createdAt: today },
  { id: 'p-21', name: 'حسام الدين عبدالله الطاهر', phone: '771555200', nationalId: '12234567', age: 57, gender: 'male', bloodType: 'B+', address: 'صنعاء — بنك المدينة', medicalHistory: ['ذبحة صدرية', 'قسطرة قلبية (2023)'], createdAt: today },
  { id: 'p-22', name: 'لطيفة محمد الشراحي', phone: '773777300', nationalId: '12345678', age: 23, gender: 'female', bloodType: 'A-', address: 'عدن — أبين', medicalHistory: [], createdAt: today },
  { id: 'p-23', name: 'أنس خليل الغيلاني', phone: '778111400', nationalId: '12456789', age: 47, gender: 'male', bloodType: 'AB+', address: 'صنعاء — الروضة', medicalHistory: ['قولون عصبي', 'قلق مزمن'], createdAt: today },
  { id: 'p-24', name: 'شيماء محمد عوض', phone: '777999500', nationalId: '12567890', age: 33, gender: 'female', bloodType: 'O+', address: 'تعز — الربوة', medicalHistory: ['فقر دم بالحمل'], createdAt: today },
  { id: 'p-25', name: 'بلال فتحي المطري', phone: '776444600', nationalId: '12678901', age: 20, gender: 'male', bloodType: 'B-', address: 'صنعاء — الجراف', medicalHistory: [], createdAt: today },
];

// ─── Appointments ─────────────────────────────────────────────────────────────
export const INITIAL_APPOINTMENTS: Appointment[] = [
  // Today's active appointments
  { id: 'APT-001', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', doctorId: 'd-1', clinicId: 'c-1', date: today, time: '08:30', status: 'completed', type: 'consultation', cost: 8000, isPaid: true, returnDate: daysAgo(-7) },
  { id: 'APT-002', patientId: 'p-2', patientName: 'فاطمة أحمد حسين القحطاني', doctorId: 'd-2', clinicId: 'c-2', date: today, time: '09:00', status: 'in_consultation', type: 'followup', cost: 2500, isPaid: true },
  { id: 'APT-003', patientId: 'p-3', patientName: 'صالح علي عبده الشمري', doctorId: 'd-1', clinicId: 'c-1', date: today, time: '09:30', status: 'waiting', type: 'consultation', cost: 8000, isPaid: false },
  { id: 'APT-004', patientId: 'p-4', patientName: 'نورة سالم بن طالب', doctorId: 'd-4', clinicId: 'c-4', date: today, time: '09:00', status: 'waiting', type: 'consultation', cost: 9000, isPaid: true },
  { id: 'APT-005', patientId: 'p-5', patientName: 'أحمد ناصر المقطري', doctorId: 'd-7', clinicId: 'c-7', date: today, time: '14:30', status: 'scheduled', type: 'consultation', cost: 8000, isPaid: false },
  { id: 'APT-006', patientId: 'p-6', patientName: 'مريم علي الحداد', doctorId: 'd-5', clinicId: 'c-5', date: today, time: '11:00', status: 'scheduled', type: 'followup', cost: 6000, isPaid: true },
  { id: 'APT-007', patientId: 'p-7', patientName: 'عمر فيصل الحسني', doctorId: 'd-1', clinicId: 'c-1', date: today, time: '10:30', status: 'waiting', type: 'followup', cost: 4000, isPaid: true },
  { id: 'APT-008', patientId: 'p-8', patientName: 'هند محمد الشرفي', doctorId: 'd-4', clinicId: 'c-4', date: today, time: '10:00', status: 'scheduled', type: 'consultation', cost: 9000, isPaid: false },
  { id: 'APT-009', patientId: 'p-21', patientName: 'حسام الدين عبدالله الطاهر', doctorId: 'd-5', clinicId: 'c-5', date: today, time: '14:00', status: 'scheduled', type: 'consultation', cost: 12000, isPaid: false },
  // Yesterday
  { id: 'APT-010', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', doctorId: 'd-1', clinicId: 'c-1', date: daysAgo(1), time: '08:00', status: 'completed', type: 'consultation', cost: 8000, isPaid: true },
  { id: 'APT-011', patientId: 'p-10', patientName: 'خديجة سعيد الأسمري', doctorId: 'd-9', clinicId: 'c-9', date: daysAgo(1), time: '15:00', status: 'completed', type: 'followup', cost: 3500, isPaid: true },
  { id: 'APT-012', patientId: 'p-11', patientName: 'طارق نجيب المحمدي', doctorId: 'd-3', clinicId: 'c-3', date: daysAgo(1), time: '10:00', status: 'completed', type: 'consultation', cost: 7000, isPaid: true },
  { id: 'APT-013', patientId: 'p-12', patientName: 'زينب عبدالكريم الجابري', doctorId: 'd-9', clinicId: 'c-9', date: daysAgo(1), time: '16:00', status: 'cancelled', type: 'followup', cost: 3500, isPaid: false },
  // 2 days ago
  { id: 'APT-014', patientId: 'p-13', patientName: 'محمد عبده اليافعي', doctorId: 'd-7', clinicId: 'c-7', date: daysAgo(2), time: '14:00', status: 'completed', type: 'consultation', cost: 8000, isPaid: true },
  { id: 'APT-015', patientId: 'p-14', patientName: 'آمال حسن الربيعي', doctorId: 'd-4', clinicId: 'c-4', date: daysAgo(2), time: '09:30', status: 'completed', type: 'consultation', cost: 9000, isPaid: true },
  { id: 'APT-016', patientId: 'p-6', patientName: 'مريم علي الحداد', doctorId: 'd-5', clinicId: 'c-5', date: daysAgo(2), time: '11:30', status: 'completed', type: 'consultation', cost: 12000, isPaid: true },
  { id: 'APT-017', patientId: 'p-15', patientName: 'سامي علي القدسي', doctorId: 'd-3', clinicId: 'c-3', date: daysAgo(2), time: '13:00', status: 'completed', type: 'consultation', cost: 7000, isPaid: true },
  // 3 days ago
  { id: 'APT-018', patientId: 'p-16', patientName: 'وفاء إبراهيم المطري', doctorId: 'd-9', clinicId: 'c-9', date: daysAgo(3), time: '15:30', status: 'completed', type: 'followup', cost: 3500, isPaid: true },
  { id: 'APT-019', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', doctorId: 'd-5', clinicId: 'c-5', date: daysAgo(3), time: '11:00', status: 'completed', type: 'followup', cost: 6000, isPaid: true },
  { id: 'APT-020', patientId: 'p-17', patientName: 'فهد ناصر الغامدي', doctorId: 'd-1', clinicId: 'c-1', date: daysAgo(3), time: '08:30', status: 'completed', type: 'consultation', cost: 8000, isPaid: true },
  // Last week
  { id: 'APT-021', patientId: 'p-3', patientName: 'صالح علي عبده الشمري', doctorId: 'd-1', clinicId: 'c-1', date: daysAgo(7), time: '09:00', status: 'completed', type: 'consultation', cost: 8000, isPaid: true },
  { id: 'APT-022', patientId: 'p-5', patientName: 'أحمد ناصر المقطري', doctorId: 'd-7', clinicId: 'c-7', date: daysAgo(7), time: '14:00', status: 'completed', type: 'consultation', cost: 8000, isPaid: true },
  { id: 'APT-023', patientId: 'p-18', patientName: 'ريم أحمد الأنيسي', doctorId: 'd-4', clinicId: 'c-4', date: daysAgo(7), time: '09:30', status: 'completed', type: 'consultation', cost: 9000, isPaid: true },
  { id: 'APT-024', patientId: 'p-19', patientName: 'عادل حمود الحربي', doctorId: 'd-1', clinicId: 'c-1', date: daysAgo(7), time: '10:30', status: 'completed', type: 'followup', cost: 4000, isPaid: true },
  { id: 'APT-025', patientId: 'p-20', patientName: 'سلمى علي الشمايلة', doctorId: 'd-2', clinicId: 'c-2', date: daysAgo(7), time: '11:00', status: 'completed', type: 'consultation', cost: 5000, isPaid: true },
];

// ─── Receipts ─────────────────────────────────────────────────────────────────
export const INITIAL_RECEIPTS = [
  { id: 'REC-001', receiptNumber: 'REC-001', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', patientAge: 45, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 8000, paymentMethod: 'cash', date: today, time: '08:35' },
  { id: 'REC-002', receiptNumber: 'REC-002', patientId: 'p-2', patientName: 'فاطمة أحمد حسين القحطاني', patientAge: 32, serviceId: 'svc-0', serviceName: 'معاينة طبيب عام', doctorId: 'd-2', doctorName: 'سارة عبدالله محمد', amount: 2500, paymentMethod: 'cash', date: today, time: '09:05' },
  { id: 'REC-003', receiptNumber: 'REC-003', patientId: 'p-4', patientName: 'نورة سالم بن طالب', patientAge: 28, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-4', doctorName: 'مريم أحمد العمري', amount: 9000, paymentMethod: 'card', date: today, time: '09:10' },
  { id: 'REC-004', receiptNumber: 'REC-004', patientId: 'p-7', patientName: 'عمر فيصل الحسني', patientAge: 35, serviceId: 'svc-1', serviceName: 'معاينة طبيب أخصائي', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 4000, paymentMethod: 'cash', date: today, time: '10:32' },
  { id: 'REC-005', receiptNumber: 'REC-005', patientId: 'p-6', patientName: 'مريم علي الحداد', patientAge: 55, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-5', doctorName: 'يوسف ناصر المقطري', amount: 6000, paymentMethod: 'card', date: today, time: '11:02' },
  { id: 'REC-006', receiptNumber: 'REC-006', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', patientAge: 63, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 8000, paymentMethod: 'cash', date: daysAgo(1), time: '08:15' },
  { id: 'REC-007', receiptNumber: 'REC-007', patientId: 'p-10', patientName: 'خديجة سعيد الأسمري', patientAge: 48, serviceId: 'svc-1', serviceName: 'معاينة طبيب أخصائي', doctorId: 'd-9', doctorName: 'ياسمين محمود حمدان', amount: 3500, paymentMethod: 'cash', date: daysAgo(1), time: '15:05' },
  { id: 'REC-008', receiptNumber: 'REC-008', patientId: 'p-11', patientName: 'طارق نجيب المحمدي', patientAge: 29, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-3', doctorName: 'خالد صالح العمري', amount: 7000, paymentMethod: 'card', date: daysAgo(1), time: '10:20' },
  { id: 'REC-009', receiptNumber: 'REC-009', patientId: 'p-13', patientName: 'محمد عبده اليافعي', patientAge: 52, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-7', doctorName: 'فارس محمد الشمري', amount: 8000, paymentMethod: 'cash', date: daysAgo(2), time: '14:10' },
  { id: 'REC-010', receiptNumber: 'REC-010', patientId: 'p-14', patientName: 'آمال حسن الربيعي', patientAge: 41, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-4', doctorName: 'مريم أحمد العمري', amount: 9000, paymentMethod: 'cash', date: daysAgo(2), time: '09:40' },
  { id: 'REC-011', receiptNumber: 'REC-011', patientId: 'p-6', patientName: 'مريم علي الحداد', patientAge: 55, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-5', doctorName: 'يوسف ناصر المقطري', amount: 12000, paymentMethod: 'card', date: daysAgo(2), time: '11:40' },
  { id: 'REC-012', receiptNumber: 'REC-012', patientId: 'p-15', patientName: 'سامي علي القدسي', patientAge: 19, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-3', doctorName: 'خالد صالح العمري', amount: 7000, paymentMethod: 'cash', date: daysAgo(2), time: '13:15' },
  { id: 'REC-013', receiptNumber: 'REC-013', patientId: 'p-16', patientName: 'وفاء إبراهيم المطري', patientAge: 44, serviceId: 'svc-1', serviceName: 'معاينة طبيب أخصائي', doctorId: 'd-9', doctorName: 'ياسمين محمود حمدان', amount: 3500, paymentMethod: 'cash', date: daysAgo(3), time: '15:40' },
  { id: 'REC-014', receiptNumber: 'REC-014', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', patientAge: 45, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-5', doctorName: 'يوسف ناصر المقطري', amount: 6000, paymentMethod: 'card', date: daysAgo(3), time: '11:05' },
  { id: 'REC-015', receiptNumber: 'REC-015', patientId: 'p-17', patientName: 'فهد ناصر الغامدي', patientAge: 66, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 8000, paymentMethod: 'cash', date: daysAgo(3), time: '08:40' },
  { id: 'REC-016', receiptNumber: 'REC-016', patientId: 'p-3', patientName: 'صالح علي عبده الشمري', patientAge: 58, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 8000, paymentMethod: 'cash', date: daysAgo(7), time: '09:10' },
  { id: 'REC-017', receiptNumber: 'REC-017', patientId: 'p-5', patientName: 'أحمد ناصر المقطري', patientAge: 40, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-7', doctorName: 'فارس محمد الشمري', amount: 8000, paymentMethod: 'card', date: daysAgo(7), time: '14:10' },
  { id: 'REC-018', receiptNumber: 'REC-018', patientId: 'p-18', patientName: 'ريم أحمد الأنيسي', patientAge: 26, serviceId: 'svc-2', serviceName: 'معاينة طبيب استشاري', doctorId: 'd-4', doctorName: 'مريم أحمد العمري', amount: 9000, paymentMethod: 'cash', date: daysAgo(7), time: '09:35' },
  { id: 'REC-019', receiptNumber: 'REC-019', patientId: 'p-20', patientName: 'سلمى علي الشمايلة', patientAge: 30, serviceId: 'svc-1', serviceName: 'معاينة طبيب أخصائي', doctorId: 'd-2', doctorName: 'سارة عبدالله محمد', amount: 5000, paymentMethod: 'cash', date: daysAgo(7), time: '11:10' },
  { id: 'REC-020', receiptNumber: 'REC-020', patientId: 'p-19', patientName: 'عادل حمود الحربي', patientAge: 34, serviceId: 'svc-1', serviceName: 'معاينة طبيب أخصائي', doctorId: 'd-1', doctorName: 'أحمد محمد الوالي', amount: 4000, paymentMethod: 'cash', date: daysAgo(7), time: '10:40' },
];

// ─── Lab Tests (ordered + completed) ─────────────────────────────────────────
export const INITIAL_LAB_TESTS = [
  { id: 'LAB-001', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', testId: 'mlt-0', testType: 'فحص دم شامل (CBC)', doctorId: 'd-1', status: 'completed', date: daysAgo(7), parameterResults: { 'cbc-1': '7.2', 'cbc-2': '4.9', 'cbc-3': '14.5', 'cbc-5': '44', 'cbc-6': '88', 'cbc-7': '230' } },
  { id: 'LAB-002', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', testId: 'mlt-8', testType: 'فحص الهيموغلوبين السكري (HbA1c)', doctorId: 'd-1', status: 'completed', date: daysAgo(7), parameterResults: { 'hba1c-1': '7.8' } },
  { id: 'LAB-003', patientId: 'p-3', patientName: 'صالح علي عبده الشمري', testId: 'mlt-1', testType: 'سكر الدم العشوائي (RBS)', doctorId: 'd-1', status: 'completed', date: daysAgo(3), parameterResults: { 'rbs-1': '212' } },
  { id: 'LAB-004', patientId: 'p-6', patientName: 'مريم علي الحداد', testId: 'mlt-2', testType: 'وظائف الكبد (LFT)', doctorId: 'd-5', status: 'completed', date: daysAgo(2), parameterResults: { 'lft-1': '38', 'lft-2': '35', 'lft-3': '92', 'lft-4': '0.8', 'lft-5': '4.1' } },
  { id: 'LAB-005', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', testId: 'mlt-3', testType: 'وظائف الكلى (KFT)', doctorId: 'd-1', status: 'completed', date: daysAgo(1), parameterResults: { 'kft-1': '2.1', 'kft-3': '62', 'kft-4': '8.9' } },
  { id: 'LAB-006', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', testId: 'mlt-0', testType: 'فحص دم شامل (CBC)', doctorId: 'd-1', status: 'completed', date: daysAgo(1), parameterResults: { 'cbc-1': '12.8', 'cbc-3': '10.2', 'cbc-7': '98' } },
  { id: 'LAB-007', patientId: 'p-2', patientName: 'فاطمة أحمد حسين القحطاني', testId: 'mlt-0', testType: 'فحص دم شامل (CBC)', doctorId: 'd-2', status: 'pending', date: today },
  { id: 'LAB-008', patientId: 'p-3', patientName: 'صالح علي عبده الشمري', testId: 'mlt-8', testType: 'فحص الهيموغلوبين السكري (HbA1c)', doctorId: 'd-1', status: 'pending', date: today },
  { id: 'LAB-009', patientId: 'p-7', patientName: 'عمر فيصل الحسني', testId: 'mlt-4', testType: 'فحص الدهون (Lipid Profile)', doctorId: 'd-1', status: 'pending', date: today },
  { id: 'LAB-010', patientId: 'p-17', patientName: 'فهد ناصر الغامدي', testId: 'mlt-3', testType: 'وظائف الكلى (KFT)', doctorId: 'd-1', status: 'pending', date: today },
  { id: 'LAB-011', patientId: 'p-21', patientName: 'حسام الدين عبدالله الطاهر', testId: 'mlt-0', testType: 'فحص دم شامل (CBC)', doctorId: 'd-5', status: 'pending', date: today },
];

// ─── Radiology Scans ──────────────────────────────────────────────────────────
export const INITIAL_RADIOLOGY_SCANS = [
  { id: 'RAD-001', patientId: 'p-5', patientName: 'أحمد ناصر المقطري', scanType: 'أشعة سينية (X-Ray) — العمود الفقري القطني', doctorId: 'd-7', status: 'completed', notes: 'انزلاق غضروفي L4-L5 طفيف', date: daysAgo(7) },
  { id: 'RAD-002', patientId: 'p-6', patientName: 'مريم علي الحداد', scanType: 'إيكو قلب (Echocardiography)', doctorId: 'd-5', status: 'completed', notes: 'ضعف وظيفة القلب — EF: 45%', date: daysAgo(2) },
  { id: 'RAD-003', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', scanType: 'سونار بطن (Abdominal Ultrasound)', doctorId: 'd-9', status: 'completed', notes: 'تليف كبدي. طحال 14 سم. استسقاء خفيف', date: daysAgo(1) },
  { id: 'RAD-004', patientId: 'p-13', patientName: 'محمد عبده اليافعي', scanType: 'أشعة سينية (X-Ray) — الركبة اليسرى', doctorId: 'd-7', status: 'completed', notes: 'هشاشة درجة II في المفصل الأنسي', date: daysAgo(2) },
  { id: 'RAD-005', patientId: 'p-21', patientName: 'حسام الدين عبدالله الطاهر', scanType: 'إيكو قلب (Echocardiography)', doctorId: 'd-5', status: 'pending', date: today },
  { id: 'RAD-006', patientId: 'p-7', patientName: 'عمر فيصل الحسني', scanType: 'أشعة مقطعية للرأس (CT Brain)', doctorId: 'd-1', status: 'pending', date: today },
];

// ─── Clinical Visits ──────────────────────────────────────────────────────────
export const INITIAL_CLINICAL_VISITS = [
  {
    id: 'VIS-001', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', doctorId: 'd-1', clinicId: 'c-1',
    date: daysAgo(7),
    vitals: { temp: '36.8', bp: '145/92', hr: '82', spo2: '97', weight: '88' },
    diagnosis: 'ارتفاع ضغط الدم غير المنضبط — سكري النوع الثاني بمضاعفات نيفروباثية بدائية',
    treatmentPlan: 'تعديل جرعة الميتفورمين إلى 1000mg مرتين يومياً. إضافة أمبريل 2mg صباحاً. مراجعة بعد أسبوعين مع صيام كامل.',
    prescriptions: ['ميتفورمين 1000mg', 'أمبريل 2mg', 'أملور 5mg'],
    labOrders: ['mlt-8', 'mlt-3'],
    radOrders: [],
  },
  {
    id: 'VIS-002', patientId: 'p-6', patientName: 'مريم علي الحداد', doctorId: 'd-5', clinicId: 'c-5',
    date: daysAgo(2),
    vitals: { temp: '36.5', bp: '155/100', hr: '95', spo2: '93', weight: '74' },
    diagnosis: 'قصور قلب احتقاني NYHA Class II — ارتفاع ضغط دم',
    treatmentPlan: 'بيسوبرولول 5mg يومياً. فوروسيمايد 40mg صباحاً. تخفيض السوائل اليومية. مراجعة شهرية + إيكو كل 3 أشهر.',
    prescriptions: ['بيسوبرولول 5mg', 'فوروسيمايد 40mg', 'رامبريل 5mg'],
    labOrders: ['mlt-2', 'mlt-3'],
    radOrders: ['إيكو قلب'],
  },
  {
    id: 'VIS-003', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', doctorId: 'd-1', clinicId: 'c-1',
    date: daysAgo(1),
    vitals: { temp: '37.1', bp: '110/70', hr: '78', spo2: '95', weight: '62' },
    diagnosis: 'تليف كبدي مرحلة Child-Pugh B — استسقاء خفيف — قصور كلوي مزمن CKD Stage III',
    treatmentPlan: 'سبيرونولاكتون 100mg. فوروسيمايد 40mg. برفيريل 5mg. حمية قليلة الملح والبروتين. إحالة لمتخصص الكبد.',
    prescriptions: ['سبيرونولاكتون 100mg', 'فوروسيمايد 40mg', 'لاكتيلوز 15ml'],
    labOrders: ['mlt-0', 'mlt-2', 'mlt-3'],
    radOrders: ['سونار بطن'],
  },
];

// ─── Prescriptions ────────────────────────────────────────────────────────────
export const INITIAL_PRESCRIPTIONS = [
  {
    id: 'RX-001', patientId: 'p-1', patientName: 'عبدالله محمد ناصر الوالي', doctorId: 'd-1',
    items: [
      { medicineId: 'mm-18', tradeName: 'ميتفورمين 1000mg', dosage: '1x2', duration: '30 يوماً', instructions: 'بعد الأكل صباحاً ومساءً' },
      { medicineId: 'mm-8', tradeName: 'أملور 5mg', dosage: '1x1', duration: '30 يوماً', instructions: 'صباحاً مع الإفطار' },
    ],
    status: 'dispensed', date: daysAgo(7),
  },
  {
    id: 'RX-002', patientId: 'p-6', patientName: 'مريم علي الحداد', doctorId: 'd-5',
    items: [
      { medicineId: 'mm-4', tradeName: 'كونكور 5mg', dosage: '1x1', duration: '30 يوماً', instructions: 'صباحاً' },
      { medicineId: 'mm-7', tradeName: 'أوميبرازول 20mg', dosage: '1x1', duration: '30 يوماً', instructions: 'قبل الإفطار' },
    ],
    status: 'active', date: daysAgo(2),
  },
  {
    id: 'RX-003', patientId: 'p-2', patientName: 'فاطمة أحمد حسين القحطاني', doctorId: 'd-2',
    items: [
      { medicineId: 'mm-6', tradeName: 'فينتولين إنهيلر', dosage: 'عند الحاجة', duration: '60 يوماً', instructions: '2 بخة عند الضيق' },
      { medicineId: 'mm-15', tradeName: 'كلاريتين 10mg', dosage: '1x1', duration: '30 يوماً', instructions: 'مساءً' },
    ],
    status: 'active', date: today,
  },
];

// ─── Inpatients ───────────────────────────────────────────────────────────────
export const INITIAL_INPATIENTS = [
  { id: 'ADM-001', patientId: 'p-9', patientName: 'يحيى إبراهيم العواضي', roomNumber: '101', bedNumber: '2', departmentId: 'dept-1', admissionDate: daysAgo(1), status: 'active', diagnosis: 'تليف كبدي مع استسقاء', attendingDoctorId: 'd-1' },
  { id: 'ADM-002', patientId: 'p-6', patientName: 'مريم علي الحداد', roomNumber: '205', bedNumber: '1', departmentId: 'dept-5', admissionDate: daysAgo(2), status: 'active', diagnosis: 'قصور قلب احتقاني للمراقبة', attendingDoctorId: 'd-5' },
  { id: 'ADM-003', patientId: 'p-21', patientName: 'حسام الدين عبدالله الطاهر', roomNumber: '206', bedNumber: '2', departmentId: 'dept-5', admissionDate: today, status: 'active', diagnosis: 'ذبحة صدرية غير مستقرة', attendingDoctorId: 'd-5' },
  { id: 'ADM-004', patientId: 'p-15', patientName: 'سامي علي القدسي', roomNumber: '301', bedNumber: '1', departmentId: 'dept-3', admissionDate: daysAgo(2), status: 'active', diagnosis: 'كسر الساق اليمنى — ما بعد العملية', attendingDoctorId: 'd-3' },
  { id: 'ADM-005', patientId: 'p-24', patientName: 'شيماء محمد عوض', roomNumber: '401', bedNumber: '3', departmentId: 'dept-4', admissionDate: today, status: 'active', diagnosis: 'مخاض طبيعي — الأسبوع 39', attendingDoctorId: 'd-4' },
];

// ─── Nurses ───────────────────────────────────────────────────────────────────
export const INITIAL_NURSES = [
  { id: 'n-1', name: 'هنادي عبدالله صالح', phone: '770100001', departmentId: 'dept-1', gender: 'female', shift: 'صباحي' },
  { id: 'n-2', name: 'محمد علي الجابري', phone: '770100002', departmentId: 'dept-3', gender: 'male', shift: 'مسائي' },
  { id: 'n-3', name: 'رهف سعيد الحراصي', phone: '770100003', departmentId: 'dept-2', gender: 'female', shift: 'صباحي' },
  { id: 'n-4', name: 'وليد حسن المطري', phone: '770100004', departmentId: 'dept-5', gender: 'male', shift: 'ليلي' },
  { id: 'n-5', name: 'سعاد أحمد العمري', phone: '770100005', departmentId: 'dept-4', gender: 'female', shift: 'صباحي' },
  { id: 'n-6', name: 'أمين مصطفى الشرجبي', phone: '770100006', departmentId: 'dept-3', gender: 'male', shift: 'مسائي' },
];

// ─── Operations ───────────────────────────────────────────────────────────────
export const INITIAL_OPERATIONS = [
  { id: 'op-1', name: 'استئصال الزائدة الدودية (Appendectomy)', price: 150000, category: 'جراحة عامة' },
  { id: 'op-2', name: 'ولادة قيصرية (C-Section)', price: 200000, category: 'نساء وولادة' },
  { id: 'op-3', name: 'قسطرة القلب التشخيصية (Cardiac Catheterization)', price: 500000, category: 'قلب' },
  { id: 'op-4', name: 'تنظير المعدة (Gastroscopy)', price: 80000, category: 'جراحة عامة' },
  { id: 'op-5', name: 'استبدال مفصل الركبة (TKR)', price: 800000, category: 'عظام' },
  { id: 'op-6', name: 'استئصال الغدة الدرقية (Thyroidectomy)', price: 250000, category: 'جراحة عامة' },
  { id: 'op-7', name: 'عملية الفتق (Hernia Repair)', price: 120000, category: 'جراحة عامة' },
  { id: 'op-8', name: 'تنظير المفاصل (Arthroscopy)', price: 200000, category: 'عظام' },
  { id: 'op-9', name: 'ربط البوق (Tubal Ligation)', price: 100000, category: 'نساء وولادة' },
  { id: 'op-10', name: 'شد الجفون (Blepharoplasty)', price: 180000, category: 'تجميل وعيون' },
];

// ─── Users ────────────────────────────────────────────────────────────────────
export const INITIAL_USERS: any[] = [
  { id: 'u-1', email: 'admin@medcenter.com', username: 'admin', password: '123', name: 'مدير النظام', role: 'admin', permissions: ['all'], status: 'active' },
  { id: 'u-doctor-1', email: 'doctor@medcenter.com', username: 'doctor', password: '123', name: 'د. أحمد محمد الوالي', role: 'doctor', permissions: ['clinical', 'read_only'], status: 'active' },
  { id: 'u-nurse-1', email: 'nurse@medcenter.com', username: 'nurse', password: '123', name: 'هنادي عبدالله صالح', role: 'nurse', permissions: ['clinical', 'registration'], status: 'active' },
  { id: 'u-ph-1', email: 'pharmacy@medcenter.com', username: 'pharmacy', password: '123', name: 'صيدلاني المناوبة', role: 'pharmacist', permissions: ['pharmacy', 'read_only'], status: 'active' },
  { id: 'u-lab-1', email: 'lab@medcenter.com', username: 'lab', password: '123', name: 'فني المختبر', role: 'lab_tech', permissions: ['lab', 'read_only'], status: 'active' },
  { id: 'u-rec-1', email: 'reception@medcenter.com', username: 'reception', password: '123', name: 'موظف الاستقبال', role: 'receptionist', permissions: ['registration', 'billing', 'read_only'], status: 'active' },
  { id: 'u-admin-2', email: 'Abdlelahalwali6@medcenter.com', username: 'Abdlelahalwali6', password: '159632Asd', name: 'Abdlelah Alwali', role: 'admin', permissions: ['all'], status: 'active' },
  { id: 'u-admin-3', email: 'alwaliabdlelah7@gmail.com', username: 'alwaliabdlelah7', password: '159632Asd', name: 'Alwali Abdlelah (Firebase)', role: 'admin', permissions: ['all'], status: 'active' },
];

// ─── Pharmacy Inventory ───────────────────────────────────────────────────────
export const INITIAL_PHARMACY_ITEMS = YEMEN_MEDICINES.map((m, i) => ({
  ...m,
  id: `pi-${i}`,
  stock: m.stock ?? 100,
  expiryDate: '2027-12-31',
}));
