# Security Specification: MedCenter HIS

## Data Invariants
1. A user cannot change their own role or permissions.
2. Only admins can delete medical records.
3. Doctors and Nurses can create/update clinical data (prescriptions, visits, lab/rad orders).
4. Pharmacists can update pharmacy stock and prescription status.
5. Lab Technicians can update lab test results.
6. Receptionists can create patients, appointments, and receipts but cannot access detailed clinical visits or prescriptions.

## The Dirty Dozen Payloads

### 1. Privilege Escalation (User context)
**Target:** `/users/my_id`
**Payload:** `{"role": "admin", "permissions": ["all"]}`
**Expected:** PERMISSION_DENIED (User cannot update their own role/permissions)

### 2. Identity Spoofing (Creating user)
**Target:** `/users/attacker_id`
**Payload:** `{"id": "attacker_id", "username": "hack", "role": "admin", "permissions": ["all"], "status": "active"}`
**Expected:** PERMISSION_DENIED (Only admins can create users)

### 3. Orphaned Patient Record (Missing required fields)
**Target:** `/patients/p-new`
**Payload:** `{"name": "Incomplete"}`
**Expected:** PERMISSION_DENIED (Missing `fileNumber`)

### 4. Shadow Field Injection
**Target:** `/doctors/d-1`
**Payload:** `{"name": "Dr. Hack", "specialization": "Surgery", "departmentId": "dept-1", "is_super_admin": true}`
**Expected:** PERMISSION_DENIED (Validation helper blocks extra keys)

### 5. Accessing Clinical Data as Receptionist
**Target:** `/clinical_visits/v-1`
**Action:** `get`
**Expected:** PERMISSION_DENIED (Receptionist role lacks `clinical` permission)

### 6. Unauthorized Stock Reduction (Patient context)
**Target:** `/pharmacy_items/item-1`
**Payload:** `{"quantity": 0}`
**Expected:** PERMISSION_DENIED (Only pharmacists/admins can update pharmacy items)

### 7. Spoofing Creator ID
**Target:** `/appointments/a-new`
**Payload:** `{"patientId": "p-1", "doctorId": "d-1", "creatorId": "admin_id"}` (Requesting user ID is `user_id`)
**Expected:** PERMISSION_DENIED (Creator ID must match `request.auth.uid`)

### 8. Invalid ID Poisoning
**Target:** `/patients/very-long-id-that-exceeds-128-characters-....................................................................................`
**Action:** `create`
**Expected:** PERMISSION_DENIED (`isValidId` check)

### 9. Illegal State Transition (Bypassing status)
**Target:** `/lab_tests/l-1`
**Payload:** `{"status": "completed", "result": "Fake Result"}` (Current user is NOT lab_tech)
**Expected:** PERMISSION_DENIED (Only lab_tech can update results)

### 10. Temporal Integrity Violation (Future createdAt)
**Target:** `/patients/p-10`
**Payload:** `{"id": "p-10", "name": "Test", "fileNumber": "F10", "createdAt": "2099-01-01"}`
**Expected:** PERMISSION_DENIED (Must use server timestamp)

### 11. Overwriting Immutable ID
**Target:** `/appointments/a-1`
**Payload:** `{"id": "a-new-id"}`
**Expected:** PERMISSION_DENIED (ID is immutable)

### 12. PII Leak via Search
**Target:** `/users`
**Action:** `list` (As non-admin)
**Expected:** PERMISSION_DENIED (Global user list is restricted)
