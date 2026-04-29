# Security Specification - User Management & Auditing

## Data Invariants
1. **Admin Exclusive**: Only users with the `admin` role can create or modify other user profiles.
2. **Self-Access**: Any authenticated user can read their own profile.
3. **Immutability of UID**: Once a user profile is created, the `id` (linked to UID) must never change.
4. **Audit Integrity**: Audit logs are write-only for authenticated users (append only) and can only be read by admins.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Spoofing**: A `doctor` tries to update their role to `admin`.
2. **Elevated Privilege Injection**: A `pharmacist` tries to add `'all'` permission to their own profile.
3. **Shadow Field Injection**: Adding a `isSuperAdmin` field to a user profile.
4. **ID Poisoning**: Creating a user with an ID that is a 2KB junk string.
5. **PII Leak**: A `nurse` trying to list all users' private emails without admin privilege.
6. **Self-Deletion**: A system `admin` trying to delete themselves (this is more of a logic check, but rules can block it).
7. **Stateless Update**: Updating a user's `lastLogin` without owning the document or being an admin.
8. **Malicious Log**: A non-authenticated user trying to write to `audit_logs`.
9. **Log Deletion**: An `admin` trying to delete an audit log to hide tracks.
10. **Role Escalation via Creation**: A `receptionist` calling `setDoc` to create an `admin` user.
11. **Email Poisoning**: Updating a user email to a string of 5000 characters.
12. **Status Bypass**: Changing `active` status to `'super_active'` (invalid enum).

## Test Runner (Conceptual)
All tests must verify `PERMISSION_DENIED` for cases where a non-admin touches another user's profile or where anyone tries to modify audit logs.
