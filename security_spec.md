# Firestore Security Specification

## 1. Data Invariants
1. **Admin RBAC & Verified Identity**: Only verified Google-authenticated admins (bootstrapped admin email `shafiq.rehman31@gmail.com` with `email_verified == true` OR existing `/admins/{request.auth.uid}` record with `email_verified == true`) can read/list/update/delete PII-bearing `orders`, `alerts`, `reportExports`, `admins`, and write to `inventory`, `cmsLanding`, and `blogPosts`.
2. **PII Isolation**: Customer PII (`fullName`, `whatsappNumber`, `email`) lives strictly inside `/orders/{orderId}`. Public visitors NEVER have `get` or `list` access to `/orders`.
3. **Non-PII Progress Tracker**: Public application progress tracking reads ONLY `/orderStatus/{trackingCode}` via single-document `get` (never `list`) and contains zero PII.
4. **Initial State Integrity**: Client-created `/orders/{orderId}` and `/orderStatus/{trackingCode}` documents MUST enforce `status == 'New Lead'`, `currentStep == 1`, `pipedriveSyncStatus == 'pending'`, and server-verified timestamps (`createdAt == request.time`, `updatedAt == request.time`).
5. **Published Content Enforcement**: Public `list` and `get` on `/blogPosts` are restricted by `resource.data.status == 'published' || isAdmin()`. Draft posts cannot be scraped by non-admins.
6. **Immutability & Anti-Shadow-Fields**: Every write path validates exact key allowlists (`hasAll` + `hasOnly`), type safety, string length bounds, numeric ranges, and immutable fields (`createdAt`, `trackingCode`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated PII Read**: Anonymous `get` / `list` on `/orders` -> `PERMISSION_DENIED`.
2. **Unverified Admin Email Spoof**: User with `email == 'shafiq.rehman31@gmail.com'` and `email_verified == false` attempting admin write -> `PERMISSION_DENIED`.
3. **Self-Assigned Admin Escalation**: Non-admin user creating `/admins/{uid}` with `role: 'super_admin'` -> `PERMISSION_DENIED`.
4. **Shadow Ghost Field Injection**: Public lead creation on `/orders/{id}` injecting extra field `isAdminApproved: true` -> `PERMISSION_DENIED` (`hasOnly` rejection).
5. **State Shortcutting on Create**: Public lead creation setting `status: 'E-License Issued'` and `currentStep: 4` -> `PERMISSION_DENIED`.
6. **Timestamp Spoofing**: Public lead creation setting `createdAt` to past/future client timestamp instead of `request.time` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: Document creation with 500-character or invalid-symbol document ID (`../admin$`) -> `PERMISSION_DENIED` (`isValidId` regex/length rejection).
8. **Resource Exhaustion (1MB String)**: Public lead creation passing a 50KB `fullName` or `businessActivity` string -> `PERMISSION_DENIED` (`.size()` limit rejection).
9. **Public Order Status Scraping**: Anonymous `list` query on `/orderStatus` -> `PERMISSION_DENIED` (`allow list: if isAdmin()`).
10. **Draft Blog Scraping**: Unauthenticated `list` on `/blogPosts` without `where('status', '==', 'published')` -> `PERMISSION_DENIED`.
11. **Public Inventory Tampering**: Non-admin attempting `update` on `/inventory/{itemId}` to drain `stockLevel` -> `PERMISSION_DENIED`.
12. **Terminal State / Immutable Field Tampering**: Attempting to overwrite `trackingCode` or `createdAt` during an order update -> `PERMISSION_DENIED`.
