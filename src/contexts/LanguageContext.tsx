import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    dashboard: 'لوحة التحكم',
    appointments: 'المواعيد والحجوزات',
    patients: 'إدارة المرضى',
    doctors: 'إدارة الأطباء',
    pharmacy: 'الصيدلية',
    laboratory: 'المختبرات',
    queue: 'قائمة الانتظار',
    settings: 'الإعدادات',
    search_placeholder: 'ابحث عن مريض، طبيب، موعد...',
    add_patient: 'إضافة مريض جديد',
    add_appointment: 'حجز موعد مسبق',
    today_revenue: 'إيرادات اليوم',
    active_users: 'مستخدمون نشطون',
    server_status: 'حالة السيرفر',
    connected: 'متصل',
    disconnected: 'غير متصل',
  },
  en: {
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    patients: 'Patients',
    doctors: 'Doctors',
    pharmacy: 'Pharmacy',
    laboratory: 'Laboratory',
    queue: 'Queue',
    settings: 'Settings',
    search_placeholder: 'Search for patient, doctor, appointment...',
    add_patient: 'Add New Patient',
    add_appointment: 'Book Appointment',
    today_revenue: "Today's Revenue",
    active_users: 'Active Users',
    server_status: 'Server Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir: language === 'ar' ? 'rtl' : 'ltr', t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
