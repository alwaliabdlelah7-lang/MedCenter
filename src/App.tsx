import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Patients = lazy(() => import('./pages/Patients'));
const ClinicsDirectory = lazy(() => import('./pages/ClinicsDirectory'));
const LabDirectory = lazy(() => import('./pages/Directories/LabDirectory'));
const OperationsDirectory = lazy(() => import('./pages/Directories/OperationsDirectory'));
const RadiologyDirectory = lazy(() => import('./pages/Directories/RadiologyDirectory'));
const PharmacyDirectory = lazy(() => import('./pages/Directories/PharmacyDirectory'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen text-lg">جاري التحميل...</div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/clinics" element={<ClinicsDirectory />} />
                <Route path="/lab" element={<LabDirectory />} />
                <Route path="/operations" element={<OperationsDirectory />} />
                <Route path="/radiology" element={<RadiologyDirectory />} />
                <Route path="/pharmacy" element={<PharmacyDirectory />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
