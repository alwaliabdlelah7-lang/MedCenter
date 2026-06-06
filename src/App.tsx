/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout.tsx';

// Feature-based imports with code splitting
import { Login } from './features/auth';
import { Dashboard, StaffChat } from './features/dashboard';
import { ClinicalVisits, AIDiagnosisAssistant, QueueManagement, Appointments } from './features/clinical';
import { Pharmacy } from './features/pharmacy';
import { Laboratory } from './features/lab';
import { Radiology } from './features/radiology';
import { InpatientManagement } from './features/inpatient';
import { ReceiptTransactions, DeferredReceipts, Returns } from './features/billing';
import { 
  UsersManagement, 
  DoctorManagement, 
  Settings, 
  Reports, 
  DoctorCommissions, 
  ClinicsDirectory,
  PatientManagement 
} from './features/admin';
import { 
  NursesDirectory, 
  StructureDirectory, 
  ServicesDirectory, 
  LabDirectory, 
  PharmacyDirectory, 
  CompanionsDirectory, 
  OperationsDirectory 
} from './features/directories';

import { dataStore } from './services/dataService';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, permission }: { children: React.ReactNode, permission?: string }) => {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;
  
  if (permission && !hasPermission(permission as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
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
              <Route path="clinical-visits" element={<ProtectedRoute permission="clinical"><ClinicalVisits /></ProtectedRoute>} />
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
              <Route path="transactions/returns" element={<ProtectedRoute permission="all"><Returns /></ProtectedRoute>} />
              
              {/* Other Sections */}
              <Route path="reports/doctor-commissions" element={<ProtectedRoute permission="admin"><DoctorCommissions /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute permission="admin"><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute permission="admin"><Settings /></ProtectedRoute>} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

