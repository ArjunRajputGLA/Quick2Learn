# Quick2Learn API Reference (v1)

This document provides the canonical specification for the Quick2Learn version 1 JSON API (`/api/v1`). The API exposes the website's data-access layer to the React Native / Expo mobile app, applying institutional authorization policies, database-backed rate limiting, and session verification.

---

## 1. Conventions & Standards

### 1.1 Base URL
All v1 endpoints are mounted under:
```http
https://quick2learn.in/api/v1
```
In local development with Android Emulator:
```http
http://10.0.2.2:3000/api/v1
```

### 1.2 Authentication
- Authentication is powered by **Better Auth** with the Expo server plugin (`@better-auth/expo`).
- Authenticated endpoints require a valid session cookie passed via the standard `Cookie` header:
  ```http
  Cookie: better-auth.session_token=<session_token>
  ```
- Mobile requests use `credentials: "omit"` alongside `Cookie: await authClient.getCookie()`.
- Unauthenticated requests to protected endpoints return `401 Unauthorized` in the standard error shape.

### 1.3 Request Headers
Every request from the mobile application includes:
- `Accept: application/json`
- `Content-Type: application/json` (for POST/PATCH)
- `X-App-Version: <semantic_version>` (e.g. `1.0.0`)
- `Cookie: <session_cookie>` (for authenticated endpoints)

### 1.4 Standard Error Response Shape
All API errors return a uniform JSON envelope with the corresponding HTTP status code:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized: Authentication required.",
    "details": null
  }
}
```

Standard error codes:
- `UNAUTHORIZED` (401): Missing or expired session cookie.
- `FORBIDDEN` (403): User lacks permission to access or modify the requested resource.
- `NOT_FOUND` (404): Target resource does not exist.
- `BAD_REQUEST` (400): Request validation failed against the Zod schema. `details` contains schema issues.
- `RATE_LIMIT_EXCEEDED` (429): Rate limit exceeded.
- `INTERNAL_SERVER_ERROR` (500): Unhandled server exception.

### 1.5 Rate Limiting
Stored in PostgreSQL table `rate_limit`:
- **Per-IP limit**: 120 requests / 60 seconds.
- **Per-User limit**: 200 requests / 60 seconds (for authenticated sessions).
Exceeding the threshold returns HTTP `429 Too Many Requests` with code `RATE_LIMIT_EXCEEDED`.

### 1.6 Pagination
List endpoints follow cursor pagination:
```json
{
  "items": [ ... ],
  "nextCursor": "2026-10-18T14:30:00.000Z"
}
```
Pass the `nextCursor` value as the `cursor` query parameter on subsequent calls. When `nextCursor` is `null`, no further items exist.

---

## 2. Endpoints

### 2.1 App Configuration
Retrieves remote application configuration, minimum supported app versions, maintenance flags, and feature toggles.

- **Method**: `GET`
- **Route**: `/api/v1/app/config`
- **Auth**: None (Public)

#### Request Example
```http
GET /api/v1/app/config HTTP/1.1
Host: quick2learn.in
X-App-Version: 1.0.0
Accept: application/json
```

#### Response Example (200 OK)
```json
{
  "minSupportedVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "maintenance": false,
  "featureFlags": {
    "enablePushNotifications": true,
    "enableOfflineDownloads": false,
    "enableParentPortal": true
  }
}
```

---

### 2.2 Current User Profile
Retrieves the logged-in user profile, role, and any linked student profiles (for parent accounts).

- **Method**: `GET`
- **Route**: `/api/v1/me`
- **Auth**: Required (Session Cookie)

#### Request Example
```http
GET /api/v1/me HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
X-App-Version: 1.0.0
Accept: application/json
```

#### Response Example (200 OK)
```json
{
  "user": {
    "id": "usr_998877",
    "email": "student@example.com",
    "name": "Aarav Sharma",
    "image": null,
    "emailVerified": true,
    "createdAt": "2026-10-08T10:00:00.000Z",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  },
  "profile": {
    "id": "7d9b3a5e-1c2d-4e5f-a6b7-8c9d0e1f2a3b",
    "userId": "usr_998877",
    "fullName": "Aarav Sharma",
    "phone": "9876543210",
    "role": "student",
    "classLevel": 12,
    "board": "cbse",
    "school": "DPS Mathura",
    "parentName": "Rajesh Sharma",
    "parentPhone": "9876500000",
    "city": "Mathura",
    "avatarUrl": null,
    "onboardedAt": "2026-10-08T10:05:00.000Z",
    "createdAt": "2026-10-08T10:00:00.000Z",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  },
  "role": "student",
  "linkedStudents": []
}
```

#### Response Example for Parent Account (200 OK)
```json
{
  "user": {
    "id": "usr_parent_1",
    "email": "rajesh@example.com",
    "name": "Rajesh Sharma",
    "image": null,
    "emailVerified": true,
    "createdAt": "2026-10-09T08:00:00.000Z",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  },
  "profile": {
    "id": "8e1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "userId": "usr_parent_1",
    "fullName": "Rajesh Sharma",
    "phone": "9876500000",
    "role": "student",
    "classLevel": null,
    "board": null,
    "school": null,
    "parentName": null,
    "parentPhone": null,
    "city": "Mathura",
    "avatarUrl": null,
    "onboardedAt": "2026-10-09T08:05:00.000Z",
    "createdAt": "2026-10-09T08:00:00.000Z",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  },
  "role": "student",
  "linkedStudents": [
    {
      "id": "7d9b3a5e-1c2d-4e5f-a6b7-8c9d0e1f2a3b",
      "userId": "usr_998877",
      "fullName": "Aarav Sharma",
      "phone": "9876543210",
      "classLevel": 12,
      "board": "cbse",
      "school": "DPS Mathura",
      "avatarUrl": null
    }
  ]
}
```

#### Unauthorized Response (401 Unauthorized)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized: Authentication required."
  }
}
```

---

### 2.3 Update Current User Profile
Updates whitelisted fields on the user's profile. System role and user ID cannot be altered through this endpoint.

- **Method**: `PATCH`
- **Route**: `/api/v1/me`
- **Auth**: Required (Session Cookie)

#### Whitelisted Request Fields
- `fullName` (string, optional, 2–100 chars)
- `phone` (string, optional, 10-digit Indian phone)
- `classLevel` (integer, optional, 9–12)
- `board` (`"cbse"` | `"icse"` | `"isc"`, optional)
- `school` (string, optional, max 150 chars, nullable)
- `parentName` (string, optional, max 100 chars, nullable)
- `parentPhone` (string, optional, 10-digit Indian phone, nullable)
- `city` (string, optional, max 100 chars, nullable)
- `avatarUrl` (string, optional, url max 500 chars, nullable)

#### Request Example
```http
PATCH /api/v1/me HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
Content-Type: application/json

{
  "fullName": "Aarav S. Rajput",
  "city": "Mathura",
  "school": "St. Dominic's Mathura"
}
```

#### Response Example (200 OK)
Returns the updated `MeResponse` object.

---

### 2.4 Register Device Token (Push Notifications)
Registers or refreshes an Expo push token for the authenticated user's device.

- **Method**: `POST`
- **Route**: `/api/v1/devices`
- **Auth**: Required (Session Cookie)

#### Request Body
- `expoPushToken` (string, required): Expo push token (`ExponentPushToken[...]`).
- `platform` (`"android"` | `"ios"`, required): Device operating system.
- `appVersion` (string, optional): Current installed app version (e.g. `1.0.0`).

#### Request Example
```http
POST /api/v1/devices HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
Content-Type: application/json

{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

#### Response Example (201 Created)
```json
{
  "id": "e4f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
  "userId": "usr_998877",
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "appVersion": "1.0.0",
  "lastSeenAt": "2026-10-18T14:35:00.000Z",
  "disabledAt": null
}
```

---

### 2.5 Unregister Device Token
Removes or unregisters an Expo push token when the user logs out.

- **Method**: `DELETE`
- **Route**: `/api/v1/devices/:id`
- **Auth**: Required (Session Cookie, token must belong to user)

#### Request Example
```http
DELETE /api/v1/devices/e4f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
```

#### Response Example (200 OK)
```json
{
  "success": true
}
```

#### Forbidden Response (403 Forbidden)
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this device token"
  }
}
```

---

### 2.6 List Notifications
Retrieves paginated user inbox notifications ordered newest first.

- **Method**: `GET`
- **Route**: `/api/v1/notifications`
- **Query Parameters**:
  - `cursor` (string, optional): ISO timestamp cursor from `nextCursor`.
  - `limit` (integer, optional, default: 20, max: 50): Page size.
- **Auth**: Required (Session Cookie)

#### Request Example
```http
GET /api/v1/notifications?limit=10 HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
```

#### Response Example (200 OK)
```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "userId": "usr_998877",
      "type": "announcement",
      "title": "Mathematics Test Tomorrow",
      "body": "Class 12 CBSE Batch: Chapter 7 Integrals test will be held tomorrow at 5:00 PM.",
      "data": {
        "route": "/batches/class-12-target-boards"
      },
      "readAt": null,
      "createdAt": "2026-10-18T14:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

### 2.7 Mark Notifications Read
Marks specific notification IDs or all notifications as read.

- **Method**: `POST`
- **Route**: `/api/v1/notifications/read`
- **Auth**: Required (Session Cookie)

#### Request Body Options
1. Mark specific notifications:
```json
{
  "ids": ["a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"]
}
```
2. Mark all notifications as read:
```json
{
  "all": true
}
```

#### Response Example (200 OK)
```json
{
  "success": true,
  "count": 1
}
```

---

### 2.8 Unread Notification Count
Returns the count of unread inbox notifications for badge display.

- **Method**: `GET`
- **Route**: `/api/v1/notifications/unread-count`
- **Auth**: Required (Session Cookie)

#### Request Example
```http
GET /api/v1/notifications/unread-count HTTP/1.1
Host: quick2learn.in
Cookie: better-auth.session_token=s_xyz123abc
```

#### Response Example (200 OK)
```json
{
  "unreadCount": 3
}
```

---

### 2.9 Onboarding Submission
Completes two-step onboarding for a student or parent account.

- **Method**: `POST`
- **Route**: `/api/v1/onboarding`
- **Auth**: Required (Session Cookie)

#### Request Example (Student)
```json
{
  "role": "student",
  "fullName": "Aarav Sharma",
  "classLevel": 12,
  "board": "cbse",
  "school": "Delhi Public School",
  "parentPhone": "9876543210"
}
```

#### Request Example (Parent)
```json
{
  "role": "parent",
  "fullName": "Sunita Sharma",
  "inviteCode": "8K4M9P"
}
```

#### Response Example (200 OK)
Returns updated user profile payload matching `meResponseSchema`.

---

### 2.10 Linked Students (Parent)
Retrieves the list of verified linked students for the authenticated parent.

- **Method**: `GET`
- **Route**: `/api/v1/parent/students`
- **Auth**: Required (Session Cookie, role must be `parent` or `admin`)

#### Response Example (200 OK)
```json
{
  "students": [
    {
      "id": "profile_uuid_123",
      "userId": "user_student_123",
      "fullName": "Aarav Sharma",
      "phone": "9876543210",
      "classLevel": 12,
      "board": "cbse",
      "school": "Delhi Public School",
      "avatarUrl": null
    }
  ]
}
```

---

### 2.11 Claim Student Invite Code (Parent)
Links a student to the authenticated parent using a 6-character code.

- **Method**: `POST`
- **Route**: `/api/v1/parent/link`
- **Auth**: Required (Session Cookie, role must be `parent` or `admin`)

#### Request Example
```json
{
  "code": "8K4M9P"
}
```

#### Response Example (200 OK)
```json
{
  "student": {
    "id": "profile_uuid_123",
    "userId": "user_student_123",
    "fullName": "Aarav Sharma",
    "phone": "9876543210",
    "classLevel": 12,
    "board": "cbse",
    "school": "Delhi Public School",
    "avatarUrl": null
  }
}
```

---

### 2.12 Student Parent Invite Code
Retrieves or generates an ambiguous-character-free 6-character invite code valid for 24 hours.

- **Method**: `GET` / `POST`
- **Route**: `/api/v1/student/invite-code`
- **Auth**: Required (Session Cookie, role must be `student` or `admin`)

#### Response Example (200 OK)
```json
{
  "code": "8K4M9P",
  "expiresAt": "2026-10-19T14:00:00.000Z"
}
```

---


## 3. Server Push Dispatcher (`src/server/notify.ts`)

The server-side notification engine broadcasts push messages and writes persistent inbox items:

```ts
import { notify } from "@/server/notify";

// Send to specific users
await notify(["usr_1", "usr_2"], {
  type: "announcement",
  title: "Class Rescheduled",
  body: "Class starts at 6:00 PM today.",
  data: { route: "/batches/class-12-target-boards" },
});

// Send to all active students in a batch
await notify({ batchId: "uuid-batch-id" }, {
  type: "announcement",
  title: "Assignment Uploaded",
  body: "Chapter 5 assignment is now available in your resources tab.",
});

// Send to parents of students in a batch
await notify({ parentsOfBatchId: "uuid-batch-id" }, {
  type: "payment_reminder",
  title: "Monthly Fee Due",
  body: "Upcoming instalment is due on 25th of this month.",
});

// Send to all members of a role
await notify({ role: "student" }, {
  type: "system",
  title: "App Update Available",
  body: "Update Quick2Learn from the Google Play Store for new lecture notes.",
});
```

### Operational Characteristics
1. **Inbox Guarantees**: Writes persistent rows to the `notifications` table for every eligible recipient.
2. **Preference Filtering**: Checks `notification_prefs` for `(userId, type)`. If disabled, notifications are skipped for that user.
3. **Background Execution**: Dispatches via `expo-server-sdk` outside request lifecycle using Next.js `after()`.
4. **Chunking**: Chunks batches into 100 push messages per request to respect Expo limits.
5. **Token Pruning**: Disables (`disabled_at = now()`) tokens that return `DeviceNotRegistered`.
