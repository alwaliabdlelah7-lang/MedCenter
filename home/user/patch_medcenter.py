...
        path.write_text(text)
        print(f'patched {rel}')
    else:
        print(f'no changes {rel}')
Tool Call
Function Name:
Write
Arguments:
file_path:
/home/user/patch_medcenter.py
content:
from pathlib import Path

base = Path('/home/user/MedCenter')

replacements = {
    'src/types.ts': [
        (
            "export interface DynamicFieldDefinition {\n  id: string;\n  label: string;\n",
            "export interface DynamicFieldDefinition {\n  id: string;\n  label: string;\n  name?: string;\n",
        ),
        (
            "export interface Service {\n  id: string;\n  name: string;\n  departmentId: string;\n  price: number;\n  revenueAccountId: string;\n  customFields?: Record<string, any>;\n}\n",
            "export interface Service {\n  id: string;\n  name: string;\n  departmentId: string;\n  price: number;\n  revenueAccountId: string;\n  category?: string;\n  customFields?: Record<string, any>;\n}\n",
        ),
        (
            "export interface LabTest {\n  id: string;\n  patientId: string;\n  patientName: string;\n  testType: string;\n  testId?: string; // Reference to MasterLabItem\n  doctorId: string;\n  date: string;\n  status: 'pending' | 'completed';\n  result?: string; // Summary result\n  parameterResults?: Record<string, string>; // Individual results for parameters\n}\n",
            "export interface LabTest {\n  id: string;\n  patientId: string;\n  patientName: string;\n  testType: string;\n  testId?: string; // Reference to MasterLabItem\n  doctorId: string;\n  date: string;\n  status: 'pending' | 'completed';\n  result?: string; // Summary result\n  parameterResults?: Record<string, string>; // Individual results for parameters\n  price?: number;\n  parameters?: Array<LabTestParameter & { value?: string }>;\n}\n",
        ),
        (
            "export interface ClinicalVisit {\n  id: string;\n  patientId: string;\n  patientName: string;\n  doctorId: string;\n  date: string;\n",
            "export interface ClinicalVisit {\n  id: string;\n  patientId: string;\n  patientName: string;\n  doctorId: string;\n  clinicId?: string;\n  date: string;\n",
        ),
        (
            "export interface AuditLog {\n  id: string;\n  userId: string;\n  action: string;\n  details: string;\n  timestamp: string;\n}\n",
            "export interface AuditLog {\n  id: string;\n  userId: string;\n  userName?: string;\n  action: string;\n  details: string;\n  timestamp: string;\n}\n",
        ),
    ],
    'src/pages/Settings.tsx': [
        (
            "      label: newField.label!,\n      type: newField.type as any,\n",
            "      label: newField.label!,\n      name: newField.label!.trim().replace(/\\s+/g, '_').toLowerCase(),\n      type: newField.type as any,\n",
        ),
    ],
    'src/pages/DoctorManagement.tsx': [
        ("editingDoctor?.customFields?.[field.name]", "editingDoctor?.customFields?.[field.name || field.id]"),
        ("[field.name]: e.target.value", "[field.name || field.id]: e.target.value"),
    ],
    'src/pages/Directories/StructureDirectory.tsx': [
        ("editingDept?.customFields?.[field.name]", "editingDept?.customFields?.[field.name || field.id]"),
        ("[field.name]: e.target.value", "[field.name || field.id]: e.target.value"),
    ],
    'src/pages/Directories/NursesDirectory.tsx': [
        ("editingNurse?.customFields?.[field.name]", "editingNurse?.customFields?.[field.name || field.id]"),
        ("[field.name]: e.target.value", "[field.name || field.id]: e.target.value"),
    ],
    'src/pages/ClinicsDirectory.tsx': [
        ("editingClinic?.customFields?.[field.name]", "editingClinic?.customFields?.[field.name || field.id]"),
        ("[field.name]: e.target.value", "[field.name || field.id]: e.target.value"),
    ],
    'src/pages/Appointments.tsx': [
        (
            "    const updates = { \n      date: newAppointment.date, \n      time: newAppointment.time,\n      status: 'scheduled' as const\n    };\n",
            "    const updates = { \n      date: newAppointment.date || showRescheduleModal.date, \n      time: newAppointment.time || showRescheduleModal.time,\n      status: 'scheduled' as const\n    };\n",
        ),
    ],
    'src/pages/Clinical/AIDiagnosisAssistant.tsx': [
        ("      setAnalysis(result);", "      setAnalysis(result ?? null);"),
    ],
    'src/pages/Laboratory.tsx': [
        (
            "        setMasterTests(masterData.length > 0 ? masterData : YEMEN_LAB_TESTS);\n",
            "        setMasterTests(masterData.length > 0 ? masterData : YEMEN_LAB_TESTS.map((t, i) => ({ ...t, id: t.id || `LBT-${i + 1}` })));\n",
        ),
    ],
    'src/pages/PatientManagement.tsx': [
        (
            "      doctorId: 'D-ADMIN',\n      date: new Date().toISOString(),\n",
            "      doctorId: 'D-ADMIN',\n      patientName: selectedPatient.name,\n      date: new Date().toISOString(),\n",
        ),
        (
            "      patientId: selectedPatient.id,\n      testType: test.name,\n      testId: test.id,\n      date: new Date().toISOString().split('T')[0],\n      status: 'pending' as const,\n      price: test.price,\n      parameters: test.parameters.map(p => ({ ...p, value: '' }))\n",
            "      patientId: selectedPatient.id,\n      patientName: selectedPatient.name,\n      testType: test.name,\n      testId: test.id,\n      doctorId: 'D-ADMIN',\n      date: new Date().toISOString().split('T')[0],\n      status: 'pending' as const,\n      price: test.price,\n      parameters: test.parameters.map(p => ({ ...p, value: '' }))\n",
        ),
    ],
    'src/data/seedData.ts': [
        (
            "import { PharmacyItem, LabTest, Service, Doctor, Department, Clinic, Patient, Appointment } from '../types';\n\nexport const YEMEN_LAB_TESTS = [\n",
            "import { PharmacyItem, LabTest, Service, Doctor, Department, Clinic, Patient, Appointment, MasterLabItem } from '../types';\n\nexport const YEMEN_LAB_TESTS: MasterLabItem[] = [\n",
        ),
        ("  { \n    name: 'فحص دم شامل (CBC)'", "  { \n    id: 'LBT-1',\n    name: 'فحص دم شامل (CBC)'"),
        ("  { \n    name: 'سكر الدم العشوائي (RBS)'", "  { \n    id: 'LBT-2',\n    name: 'سكر الدم العشوائي (RBS)'"),
        ("  { \n    name: 'وظائف الكبد (LFT)'", "  { \n    id: 'LBT-3',\n    name: 'وظائف الكبد (LFT)'"),
        ("  { \n    name: 'وظائف الكلى (KFT)'", "  { \n    id: 'LBT-4',\n    name: 'وظائف الكلى (KFT)'"),
        ("  { \n    name: 'فحص الدهون (Lipid Profile)'", "  { \n    id: 'LBT-5',\n    name: 'فحص الدهون (Lipid Profile)'"),
        ("  { \n    name: 'فحص حمى التيفوئيد (Widal)'", "  { \n    id: 'LBT-6',\n    name: 'فحص حمى التيفوئيد (Widal)'"),
        ("  { \n    name: 'فحص الملاريا (Malaria)'", "  { \n    id: 'LBT-7',\n    name: 'فحص الملاريا (Malaria)'"),
    ],
}

for rel, edits in replacements.items():
    path = base / rel
    text = path.read_text()
    original = text
    for old, new in edits:
        if old not in text:
            raise SystemExit(f'Missing pattern in {rel}: {old[:120]!r}')
        text = text.replace(old, new)
    if text != original:
        path.write_text(text)
        print(f'patched {rel}')
    else:
        print(f'no changes {rel}')

