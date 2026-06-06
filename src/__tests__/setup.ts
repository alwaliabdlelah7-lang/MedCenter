import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Setup global test utilities
export const mockData = {
  patient: {
    id: 'patient-1',
    name: 'أحمد محمد',
    gender: 'male',
    phone: '01234567890',
    email: 'ahmed@example.com',
    address: 'صنعاء',
    createdAt: new Date().toISOString(),
  },
  doctor: {
    id: 'doctor-1',
    name: 'د. علي الحسني',
    specialization: 'جراحة عامة',
    phone: '01234567890',
    email: 'ali@example.com',
    createdAt: new Date().toISOString(),
  },
};
