export interface Patient {
  id: string;
  name: string;
  phone: string;
  nationalId?: string;
  age: number;
  gender: 'male' | 'female';
  bloodType?: string;
  address?: string;
  medicalHistory: string[];
  customFields?: Record<string, any>;
  createdAt: string;
}

export interface DynamicFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  entity: 'patient' | 'doctor' | 'nurse' | 'visit' | 'service' | 'operation' | 'lab_test' | 'medicine' | 'clinic' | 'companion' | 'department' | 'user';
  isActive: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  mobile?: string;
  fax?: string;
  email?: string;
  address?: string;
  gender: 'male' | 'female';
  notes?: string;
  departmentId: string;
  percentage: number;
  consultationFee: number;
  followupFee: number;
  returnDays: number;
  workingDays: string[];
  workingHours: { start: string; end: string };
  customFields?: Record<string, any>;
}

export interface Nurse {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  gender: 'male' | 'female';
  address?: string;
  email?: string;
  notes?: string;
  departmentId: string;
  customFields?: Record<string, any>;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  customFields?: Record<string, any>;
}

export interface Clinic {
  id: string;
  name: string;
  doctorIds: string[];
  departmentId: string;
  customFields?: Record<string, any>;
}

export interface Service {
  id: string;
  name: string;
  departmentId: string;
  price: number;
  revenueAccountId: string;
  customFields?: Record<string, any>;
}

export interface Operation {
  id: string;
  name: string;
  cost: number;
  departmentId: string;
  customFields?: Record<string, any>;
}

export interface Companion {
  id: string;
  name: string;
  patientId?: string;
  idNumber: string;
  relation?: string;
  phone?: string;
  customFields?: Record<string, any>;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  clinicId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'return';
  type: 'visit' | 'consultation' | 'followup';
  cost?: number;
  isPaid?: boolean;
  returnDate?: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  tradeName?: string;
  scientificName?: string;
  category: string;
  price: number;
  stock: number;
  expiryDate: string;
}

export interface MasterMedicine {
  id: string;
  tradeName: string;
  scientificName: string;
  category: string;
  price: number;
  unit: string; // e.g. Pack, Box, Bottle
  dosageForm: string; // e.g. Tablet, Syrup, Injection, Strip
  totalQuantity: number;
  reorderPoint: number;
  description?: string;
  customFields?: Record<string, any>;
}

export interface LabTestParameter {
  id: string;
  name: string;
  unit: string;
  defaultValue?: string;
  normalRange: string; // Simplified for this implementation
}

export interface MasterLabItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  parameters: LabTestParameter[];
  customFields?: Record<string, any>;
}

export interface LabTest {
  id: string;
  patientName: string;
  testType: string;
  testId?: string; // Reference to MasterLabItem
  doctorId: string;
  date: string;
  status: 'pending' | 'completed';
  result?: string; // Summary result
  parameterResults?: Record<string, string>; // Individual results for parameters
}

export interface RadiologyScan {
  id: string;
  patientName: string;
  scanType: string;
  doctorId: string;
  date: string;
  status: 'pending' | 'completed';
  imageUrl?: string;
  report?: string;
}

export type Permission = 'all' | 'read_only' | 'clinical' | 'pharmacy' | 'lab' | 'admin';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'receptionist';
  permissions: Permission[];
  lastLogin?: string;
  status: 'active' | 'inactive';
  customFields?: Record<string, any>;
}

export interface Receipt {
  id: string;
  patientName: string;
  patientAge: number;
  serviceId: string;
  doctorId: string;
  amount: number;
  paymentMethod: 'cash' | 'credit';
  date: string;
  status: 'paid' | 'pending' | 'returned';
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  chatId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}
