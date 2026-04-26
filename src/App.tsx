/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Login from './pages/Login.tsx';

// ... existing imports ...
import NursesDirectory from './pages/Directories/NursesDirectory.tsx';
import StructureDirectory from './pages/Directories/StructureDirectory.tsx';
import ServicesDirectory from './pages/Directories/ServicesDirectory.tsx';
import ReceiptTransactions from './pages/Transactions/ReceiptTransactions.tsx';
import DeferredReceipts from './pages/Transactions/DeferredReceipts.tsx';
import DoctorCommissions from './pages/Reports/DoctorCommissions.tsx';
import Reports from './pages/Reports.tsx';
import InpatientManagement from './pages/InpatientManagement.tsx';
import CompanionsDirectory from './pages/Directories/CompanionsDirectory.tsx';
import SettingsPage from './pages/Settings.tsx';
import Appointments from './pages/Appointments.tsx';
import Pharmacy from './pages/Pharmacy.tsx';
import Laboratory from './pages/Laboratory.tsx';
import Radiology from './pages/Radiology.tsx';

import LabDirectory from './pages/Directories/LabDirectory.tsx';
import PharmacyDirectory from './pages/Directories/PharmacyDirectory.tsx';
import ClinicsDirectory from './pages/ClinicsDirectory.tsx';
import OperationsDirectory from './pages/Directories/OperationsDirectory.tsx';
import UsersManagement from './pages/UsersManagement.tsx';
import PatientManagement from './pages/PatientManagement.tsx';
import AIDiagnosisAssistant from './pages/Clinical/AIDiagnosisAssistant.tsx';
import QueueManagement from './pages/QueueManagement.tsx';
import StaffChat from './pages/StaffChat.tsx';
import DoctorManagement from './pages/DoctorManagement.tsx';

import { LanguageProvider } from './contexts/LanguageContext';
import { dataStore } from './services/dataService';

const ProtectedRoute = ({ children, permission }: { children: React.ReactNode, permission?: string }) => {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  if (permission && !hasPermission(permission as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ... PlaceholderPage definition ...
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="glass-card p-12 rounded-3xl text-center">
    <h2 className="text-3xl font-bold text-slate-800 mb-4">{title}</h2>
    <p className="text-slate-500">جاري العمل على برمجة هذه الصفحة لتشمل كافة التفاصيل...</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={`pulse-${i}`} className="p-6 border-2 border-dashed border-slate-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  </div>
);

export default function App() {
  React.useEffect(() => {
    dataStore.autoSeedIfNeeded();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<ProtectedRoute permission="clinical"><PatientManagement /></ProtectedRoute>} />
              <Route path="appointments" element={<ProtectedRoute permission="clinical"><Appointments /></ProtectedRoute>} />
              <Route path="queue" element={<ProtectedRoute><QueueManagement /></ProtectedRoute>} />
              <Route path="diagnosis-assistant" element={<ProtectedRoute permission="clinical"><AIDiagnosisAssistant /></ProtectedRoute>} />
              <Route path="chat" element={<ProtectedRoute><StaffChat /></ProtectedRoute>} />
              
              {/* Directories Section */}
              <Route path="directories/doctors" element={<ProtectedRoute permission="admin"><DoctorManagement /></ProtectedRoute>} />
              <Route path="directories/nurses" element={<ProtectedRoute permission="admin"><NursesDirectory /></ProtectedRoute>} />
              <Route path="directories/departments" element={<ProtectedRoute permission="admin"><StructureDirectory /></ProtectedRoute>} />
              <Route path="directories/clinics" element={<ProtectedRoute permission="admin"><ClinicsDirectory /></ProtectedRoute>} />
              <Route path="directories/companions" element={<ProtectedRoute permission="admin"><CompanionsDirectory /></ProtectedRoute>} />
              <Route path="directories/services" element={<ProtectedRoute permission="admin"><ServicesDirectory /></ProtectedRoute>} />
              <Route path="directories/operations" element={<ProtectedRoute permission="admin"><OperationsDirectory /></ProtectedRoute>} />
              <Route path="directories/lab" element={<ProtectedRoute permission="admin"><LabDirectory /></ProtectedRoute>} />
              <Route path="directories/pharmacy" element={<ProtectedRoute permission="admin"><PharmacyDirectory /></ProtectedRoute>} />
              
              {/* Main Modules */}
              <Route path="pharmacy" element={<ProtectedRoute permission="pharmacy"><Pharmacy /></ProtectedRoute>} />
              <Route path="laboratory" element={<ProtectedRoute permission="lab"><Laboratory /></ProtectedRoute>} />
              <Route path="radiology" element={<ProtectedRoute permission="clinical"><Radiology /></ProtectedRoute>} />
              <Route path="inpatient" element={<ProtectedRoute permission="clinical"><InpatientManagement /></ProtectedRoute>} />
              
              {/* Users Section */}
              <Route path="users" element={<ProtectedRoute permission="admin"><UsersManagement /></ProtectedRoute>} />
              
              {/* Transactions Section */}
              <Route path="transactions/receipts" element={<ProtectedRoute permission="all"><ReceiptTransactions /></ProtectedRoute>} />
              <Route path="transactions/deferred" element={<ProtectedRoute permission="all"><DeferredReceipts /></ProtectedRoute>} />
              <Route path="transactions/returns" element={<ProtectedRoute permission="all"><PlaceholderPage title="مرتجع سندات الاستعلامات" /></ProtectedRoute>} />
              
              {/* Other Sections */}
              <Route path="reports/doctor-commissions" element={<ProtectedRoute permission="admin"><DoctorCommissions /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute permission="admin"><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute permission="admin"><SettingsPage /></ProtectedRoute>} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

