# Security Specification - MedCenter HIS

## 1. Data Invariants
- A Patient must have a unique file number.
- An Appointment must link to an existing Patient and Doctor.
- Only authorized roles can access clinical or financial data.
- System roles (admin, doctor, nurse, etc.) are strictly enforced.

## 2. Roles & Permissions Matrix
| Collection | Admin | Doctor | Nurse | Receptionist | Pharmacist |
|------------|-------|--------|-------|--------------|------------|
| doctors    | CRUD  | R      | R     | R            | R          |
| nurses     | CRUD  | R      | R     | R            | R          |
| departments| CRUD  | R      | R     | R            | R          |
| clinics    | CRUD  | R      | R     | R            | R          |
| patients   | CRUD  | RU     | RU    | CRU          | R          |
| appointments| CRUD | RU     | R     | CRU          | R          |
| pharmacy_items| CRUD | R    | R     | R            | CRU        |
| receipts   | CRUD  | R      | -     | CRU          | R          |
| users      | R     | R      | R     | R            | R          |

## 3. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Self-Promotion**: Authenticated user trying to set their own role to 'admin' in `/users`.
2. **Patient Scraping**: Logged-in user trying to read all `/patients` without proper role.
3. **Ghost Appointment**: Creating an appointment for a non-existent patient.
4. **Price Tampering**: Updating `pharmacy_items` price as a regular user.
5. **Unauthorized File Deletion**: Deleting someone else's patient record.
6. **Shadow Fields**: Adding `isVerified: true` to a patient record.
7. **Identity Poisoning**: Using a 2KB string as a `patientId`.
8. **Malicious Receipt**: Creating a receipt with a negative `amount`.
9. **Role Escalation**: Updating a `user` document to change roles.
10. **PII Leak**: Non-medical staff reading sensitive `medicalHistory`.
11. **Stale Update**: Changing `createdAt` timestamp of a finalized appointment.
12. **orphaned Record**: Creating a receipt without a valid `doctorId`.

## 4. Firestore Security Rules Draft
(Rules will be implemented in `firestore.rules`)
