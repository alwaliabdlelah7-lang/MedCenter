import { PharmacyItem, LabTest, Service, Doctor, Department, Clinic, Patient, Appointment } from '../types';

export const YEMEN_LAB_TESTS = [
  { 
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
      { id: 'cbc-7', name: 'Platelets (PLT)', unit: 'x10³/µL', normalRange: '150 - 450', minRange: 150, maxRange: 450, gender: 'both' }
    ]
  },
  { 
    name: 'سكر الدم العشوائي (RBS)', 
    price: 1500, 
    category: 'كيمياء حيوية',
    parameters: [
      { id: 'rbs-1', name: 'Random Blood Sugar', unit: 'mg/dL', normalRange: '70 - 140', minRange: 70, maxRange: 140, gender: 'both' }
    ]
  },
  { 
    name: 'وظائف الكبد (LFT)', 
    price: 8000, 
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'lft-1', name: 'ALT (SGPT)', unit: 'U/L', normalRange: '0 - 41', minRange: 0, maxRange: 41, gender: 'both' },
      { id: 'lft-2', name: 'AST (SGOT)', unit: 'U/L', normalRange: '0 - 40', minRange: 0, maxRange: 40, gender: 'both' },
      { id: 'lft-3', name: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '40 - 129', minRange: 40, maxRange: 129, gender: 'both' },
      { id: 'lft-4', name: 'Bilirubin Total', unit: 'mg/dL', normalRange: '0.1 - 1.2', minRange: 0.1, maxRange: 1.2, gender: 'both' },
      { id: 'lft-5', name: 'Albumin', unit: 'g/dL', normalRange: '3.4 - 5.4', minRange: 3.4, maxRange: 5.4, gender: 'both' }
    ]
  },
  { 
    name: 'وظائف الكلى (KFT)', 
    price: 6500, 
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'kft-1', name: 'Creatinine', unit: 'mg/dL', normalRange: '0.7 - 1.3', minRange: 0.7, maxRange: 1.3, gender: 'male' },
      { id: 'kft-2', name: 'Creatinine', unit: 'mg/dL', normalRange: '0.6 - 1.1', minRange: 0.6, maxRange: 1.1, gender: 'female' },
      { id: 'kft-3', name: 'Urea', unit: 'mg/dL', normalRange: '15 - 45', minRange: 15, maxRange: 45, gender: 'both' },
      { id: 'kft-4', name: 'Uric Acid', unit: 'mg/dL', normalRange: '3.5 - 7.2', minRange: 3.5, maxRange: 7.2, gender: 'male' }
    ]
  },
  { 
    name: 'فحص الدهون (Lipid Profile)', 
    price: 9000, 
    category: 'كيمياء حيوية',
    isProfile: true,
    parameters: [
      { id: 'lipid-1', name: 'Cholesterol Total', unit: 'mg/dL', normalRange: '< 200', maxRange: 200, gender: 'both' },
      { id: 'lipid-2', name: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', maxRange: 150, gender: 'both' },
      { id: 'lipid-3', name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '> 40', minRange: 40, gender: 'both' },
      { id: 'lipid-4', name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '< 130', maxRange: 130, gender: 'both' }
    ]
  },
  { 
    name: 'فحص حمى التيفوئيد (Widal)', 
    price: 2500, 
    category: 'أحياء دقيقة',
    parameters: [
      { id: 'widal-1', name: 'Salmonella Typhi O', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-2', name: 'Salmonella Typhi H', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-3', name: 'Salmonella Paratyphi A', unit: 'Titer', normalRange: '< 1/80', gender: 'both' },
      { id: 'widal-4', name: 'Salmonella Paratyphi B', unit: 'Titer', normalRange: '< 1/80', gender: 'both' }
    ]
  },
  { 
    name: 'فحص الملاريا (Malaria)', 
    price: 2000, 
    category: 'دمويات / أحياء دقيقة',
    parameters: [
      { id: 'mal-1', name: 'Malaria Parasite (BF)', unit: 'Result', normalRange: 'Not Seen', gender: 'both' },
      { id: 'mal-2', name: 'ICT Malaria (Ag)', unit: 'Result', normalRange: 'Negative', gender: 'both' }
    ]
  }
];

export const YEMEN_MEDICINES: Partial<PharmacyItem>[] = [
  { name: 'أوجمنتين (Augmentin)', tradeName: 'Augmentin', scientificName: 'Amoxicillin/Clavulanate', category: 'مضادات حيوية', price: 4500, stock: 50 },
  { name: 'بنادول (Panadol)', tradeName: 'Panadol', scientificName: 'Paracetamol', category: 'مسكنات', price: 1200, stock: 100 },
  { name: 'فولتارين (Voltaren)', tradeName: 'Voltaren', scientificName: 'Diclofenac', category: 'مسكنات ومضادات التهاب', price: 2500, stock: 30 },
  { name: 'جلوكوفاج (Glucophage)', tradeName: 'Glucophage', scientificName: 'Metformin', category: 'أدوية السكري', price: 3000, stock: 60 },
  { name: 'كونكور (Concor)', tradeName: 'Concor', scientificName: 'Bisoprolol', category: 'أدوية الضغط', price: 4200, stock: 40 },
  { name: 'بروفين (Brufen)', tradeName: 'Brufen', scientificName: 'Ibuprofen', category: 'مسكنات', price: 1800, stock: 80 },
  { name: 'فينتولين (Ventolin)', tradeName: 'Ventolin', scientificName: 'Salbutamol', category: 'أدوية الجهاز التنفسي', price: 3500, stock: 25 },
  { name: 'أوميبرازول (Omeprazole)', tradeName: 'Omeprazole', scientificName: 'Omeprazole', category: 'أدوية المعدة', price: 2200, stock: 55 },
  { name: 'أملور (Amlor)', tradeName: 'Amlor', scientificName: 'Amlodipine', category: 'أدوية الضغط', price: 5500, stock: 20 },
  { name: 'إنسولين ميكستارد (Mixtard)', tradeName: 'Mixtard', scientificName: 'Insulin Isophane/Regular', category: 'أدوية السكري', price: 7500, stock: 15 },
];

export const YEMEN_SERVICES: Partial<Service>[] = [
  { name: 'معاينة طبيب عام', price: 3000 },
  { name: 'معاينة طبيب أخصائي', price: 6000 },
  { name: 'معاينة طبيب استشاري', price: 10000 },
  { name: 'ضرب إبرة (عضل/وريد)', price: 500 },
  { name: 'تغيير جروح بسيط', price: 2000 },
  { name: 'تغيير جروح كبير', price: 5000 },
  { name: 'تركيب كانيولا', price: 1000 },
  { name: 'قياس ضغط وسكر', price: 500 },
  { name: 'تخطيط قلب (ECG)', price: 4000 },
  { name: 'بخار (Nebulizer)', price: 2000 },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'الباطنية', description: 'قسم الأمراض الباطنية' },
  { id: 'dept-2', name: 'الأطفال', description: 'قسم طب الأطفال والخدج' },
  { id: 'dept-3', name: 'الجراحة العامة', description: 'قسم الجراحة والعمليات' },
  { id: 'dept-4', name: 'النساء والولادة', description: 'قسم أمراض النساء والتوليد' },
  { id: 'dept-5', name: 'القلب', description: 'مركز أمراض وجراحة القلب' },
  { id: 'dept-6', name: 'الأسنان', description: 'مركز جراحة وتجميل الأسنان' },
];

export const INITIAL_CLINICS: Clinic[] = [
  { id: 'c-1', name: 'عيادة الباطنية 1', departmentId: 'dept-1', doctorIds: ['d-1'] },
  { id: 'c-2', name: 'عيادة الأطفال', departmentId: 'dept-2', doctorIds: ['d-2'] },
  { id: 'c-3', name: 'عيادة الأسنان 1', departmentId: 'dept-6', doctorIds: [] },
  { id: 'c-4', name: 'الطوارئ العامة', departmentId: 'dept-3', doctorIds: ['d-3'] },
];

export const INITIAL_DOCTORS: Doctor[] = [
  { 
    id: 'd-1', 
    name: 'أحمد الوالي', 
    specialization: 'استشاري باطنية', 
    phone: '777000000', 
    departmentId: 'dept-1', 
    gender: 'male',
    percentage: 70,
    consultationFee: 8000,
    followupFee: 4000,
    returnDays: 7,
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    workingHours: { start: '08:00', end: '20:00' }
  },
  { 
    id: 'd-2', 
    name: 'سارة محمد', 
    specialization: 'أخصائية أطفال', 
    phone: '771111111', 
    departmentId: 'dept-2', 
    gender: 'female',
    percentage: 60,
    consultationFee: 5000,
    followupFee: 2500,
    returnDays: 3,
    workingDays: ['saturday', 'sunday', 'tuesday', 'thursday'],
    workingHours: { start: '09:00', end: '16:00' }
  },
  { 
    id: 'd-3', 
    name: 'خالد صالح', 
    specialization: 'جراح عام', 
    phone: '772222222', 
    departmentId: 'dept-3', 
    gender: 'male',
    percentage: 50,
    consultationFee: 7000,
    followupFee: 3500,
    returnDays: 5,
    workingDays: ['monday', 'wednesday', 'friday'],
    workingHours: { start: '10:00', end: '22:00' }
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    name: 'عبدالله محمد ناصر',
    phone: '777123456',
    age: 45,
    gender: 'male',
    bloodType: 'O+',
    address: 'صنعاء - شارع الستين',
    medicalHistory: ['حساسية من البنسلين', 'ضغط دم مرتفع'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-2',
    name: 'فاطمة أحمد حسين',
    phone: '777987654',
    age: 32,
    gender: 'female',
    bloodType: 'A-',
    address: 'عدن - المنصورة',
    medicalHistory: ['ربو'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-3',
    name: 'صالح علي عبده',
    phone: '771223344',
    age: 58,
    gender: 'male',
    bloodType: 'B+',
    address: 'تعز - الحوبان',
    medicalHistory: ['سكري النوع الثاني'],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-101',
    patientId: 'p-1',
    patientName: 'عبدالله محمد ناصر',
    doctorId: 'd-1',
    clinicId: 'c-1',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'scheduled',
    type: 'consultation',
    cost: 8000,
    isPaid: true
  },
  {
    id: 'APT-102',
    patientId: 'p-2',
    patientName: 'فاطمة أحمد حسين',
    doctorId: 'd-2',
    clinicId: 'c-2',
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    status: 'waiting',
    type: 'followup',
    cost: 2500,
    isPaid: true
  },
  {
    id: 'APT-103',
    patientId: 'p-3',
    patientName: 'صالح علي عبده',
    doctorId: 'd-1',
    clinicId: 'c-1',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    status: 'completed',
    type: 'consultation',
    cost: 8000,
    isPaid: true,
    returnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  }
];

export const INITIAL_QUEUE = [
  {
    id: 'Q-1',
    patientId: 'p-2',
    patientName: 'فاطمة أحمد حسين',
    doctorId: 'd-2',
    clinicId: 'c-2',
    visitType: 'followup',
    status: 'waiting',
    checkInTime: '10:15',
    priority: 1
  }
];

export const INITIAL_USERS: any[] = [
  {
    id: 'u-1',
    email: 'admin@medcenter.com',
    username: 'admin',
    password: '123',
    name: 'مدير النظام',
    role: 'admin',
    permissions: ['all'],
    status: 'active'
  },
  {
    id: 'u-doctor-1',
    email: 'doctor@medcenter.com',
    username: 'doctor',
    password: '123',
    name: 'د. أحمد الوالي',
    role: 'doctor',
    permissions: ['clinical', 'read_only'],
    status: 'active'
  },
  {
    id: 'u-nurse-1',
    email: 'nurse@medcenter.com',
    username: 'nurse',
    password: '123',
    name: 'هنادي صالح',
    role: 'nurse',
    permissions: ['clinical'],
    status: 'active'
  },
  {
    id: 'u-ph-1',
    email: 'pharmacy@medcenter.com',
    username: 'pharmacy',
    password: '123',
    name: 'صيدلي المناوبة',
    role: 'pharmacist',
    permissions: ['pharmacy'],
    status: 'active'
  },
  {
    id: 'u-lab-1',
    email: 'lab@medcenter.com',
    username: 'lab',
    password: '123',
    name: 'فني المختبر',
    role: 'lab_tech',
    permissions: ['lab'],
    status: 'active'
  },
  {
    id: 'u-rec-1',
    email: 'reception@medcenter.com',
    username: 'reception',
    password: '123',
    name: 'موظف الاستقبال',
    role: 'receptionist',
    permissions: ['read_only'],
    status: 'active'
  },
  {
    id: 'u-admin-2',
    email: 'Abdlelahalwali6@medcenter.com',
    username: 'Abdlelahalwali6',
    password: '159632Asd',
    name: 'Abdlelah Alwali',
    role: 'admin',
    permissions: ['all'],
    status: 'active'
  },
  {
    id: 'u-admin-3',
    email: 'alwaliabdlelah7@gmail.com',
    username: 'alwaliabdlelah7@gmail.com',
    password: '159632Asd',
    name: 'Alwali Abdlelah',
    role: 'admin',
    permissions: ['all'],
    status: 'active'
  }
];

export const INITIAL_NURSES = [
  { id: 'n-1', name: 'هنادي صالح', phone: '770000001', departmentId: 'dept-1', gender: 'female' },
  { id: 'n-2', name: 'محمد علي', phone: '770000002', departmentId: 'dept-3', gender: 'male' },
];

export const INITIAL_OPERATIONS = [
  { id: 'op-1', name: 'استئصال الزائدة الدودية', price: 150000, category: 'جراحة عامة' },
  { id: 'op-2', name: 'ولادة قيصرية', price: 200000, category: 'نساء وولادة' },
  { id: 'op-3', name: 'عملية قسطرة قلبية', price: 500000, category: 'قلب' },
];
