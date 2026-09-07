# API Contract

This document defines the API contract for the Gym Class Booking & Trainer Chat System.

---

# 1. Overview

The system provides APIs for:

- Authentication and account management
- Member management
- Trainer management
- Gym class management
- Trainer 1-1 PT time slot management
- Class booking
- PT booking
- Package and member package management
- Payment transactions
- Reviews
- Chat between Member and Trainer
- Training progress notes
- Notifications

---

# 2. Authentication

## 2.1. Login

### Endpoint

```http
POST /auth/login
```

### Authentication

```text
Public
```

### Description

Authenticate a user using `phone` or `email` as the username.

The `username` field can contain either:

- User phone number
- User email

### Request Body

```json
{
  "username": "0901234567",
  "password": "123456"
}
```

or:

```json
{
  "username": "user@example.com",
  "password": "123456"
}
```

### Success

```text
200 OK
```

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "email": "user@example.com",
    "role": "MEMBER",
    "status": "ACTIVE"
  }
}
```

### Errors

Invalid credentials:

```text
401 Unauthorized
```

```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Username or password is incorrect"
}
```

Account locked:

```text
403 Forbidden
```

```json
{
  "code": "ACCOUNT_LOCKED",
  "message": "User account is locked"
}
```

---

## 2.2. Register

### Endpoint

```http
POST /auth/register
```

### Authentication

```text
Public
```

### Request Body

```json
{
  "phone": "0901234567",
  "email": "user@example.com",
  "password": "123456",
  "fullName": "Nguyen Van A"
}
```

### Validation

- `phone`: required and unique
- `email`: required and unique
- `password`: required
- `fullName`: required
- New users are assigned the `MEMBER` role
- New accounts are created with the appropriate initial status

### Success

```text
201 Created
```

```json
{
  "id": 1,
  "phone": "0901234567",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "role": "MEMBER",
  "status": "ACTIVE"
}
```

### Errors

```text
409 Conflict
```

```json
{
  "code": "PHONE_ALREADY_EXISTS",
  "message": "Phone number is already registered"
}
```

```text
409 Conflict
```

```json
{
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "Email is already registered"
}
```

---

## 2.3. Get Current User

### Endpoint

```http
GET /auth/me
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Success

```text
200 OK
```

```json
{
  "id": 1,
  "phone": "0901234567",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "address": "123 Nguyen Trai, HCMC",
  "avatarUrl": "/uploads/avatar.jpg",
  "role": "MEMBER",
  "status": "ACTIVE"
}
```

---

## 2.4. Logout

### Endpoint

```http
POST /auth/logout
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Success

```text
204 No Content
```

---

# 3. User APIs

## 3.1. Get My Profile

```http
GET /users/me
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Success

```text
200 OK
```
```json
{
  "id": 1,
  "phone": "0901234567",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "address": "123 Nguyen Trai, HCMC",
  "avatarUrl": "/uploads/avatar.jpg",
  "role": "MEMBER",
  "status": "ACTIVE"
}
```

Returns the current user's profile.

---

## 3.2. Update My Profile

```http
PATCH /users/me
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Request Body

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "address": "user@example.com",
  "avatarUrl": "/uploads/avatar.jpg"
}
```

### Business Rules

- User can update only their own profile.
- phone must remain unique.
- email is not changed through this API.
- address does not need to be unique.
- User cannot change their own role.
- User cannot change their own status.

### Success

```text
200 OK
```

---

## 3.3. Change Password

```http
PATCH /users/me/password
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Request Body

```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

### Success

```text
200 OK
```
### Errors
```text
400 Bad Request
```
```json
{
"code": "INVALID_CURRENT_PASSWORD",
"message": "Current password is incorrect"
}
```
---

## 3.4. Get Users

```http
GET /users
```

### Authentication

```text
ADMIN
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number |
| `size` | Integer | No | Number of records |
| `role` | String | No | MEMBER, TRAINER or ADMIN |
| `status` | String | No | PENDING, ACTIVE, LOCKED, REJECTED |
| `keyword` | String | No | Search by name, phone or address |

### Success

```text
200 OK
```

Returns a paginated list of users.

---

## 3.5. Update User Status

```http
PATCH /users/{id}/status
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "status": "LOCKED"
}
```

### Success

```text
200 OK
```

---

# 4. Trainer APIs

## 4.1. Get Trainer List

```http
GET /trainers
```

### Authentication

```text
Public
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number |
| `size` | Integer | No | Number of records |
| `specialization` | String | No | Filter by specialization |
| `status` | String | No | Trainer account status |
| `keyword` | String | No | Search by trainer name |

### Success

```text
200 OK
```

Returns a paginated list of available trainers.

---

## 4.2. Get Trainer Details

```http
GET /trainers/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

```json
{
  "id": 5,
  "fullName": "Nguyen Van B",
  "specialization": "Fitness",
  "experienceYears": 5,
  "hourlyFee": 200000,
  "bio": "Professional fitness trainer"
}
```

---

## 4.3. Create Trainer Profile

```http
POST /trainers/profile
```

### Authentication

```text
TRAINER
```

### Request Body

```json
{
  "specialization": "Fitness",
  "experienceYears": 5,
  "hourlyFee": 200000,
  "bio": "Professional fitness trainer"
}
```

### Success

```text
201 Created
```

---

## 4.4. Update Trainer Profile

```http
PATCH /trainers/profile
```

### Authentication

```text
TRAINER
```
### Request Body
```json
{
"specialization": "Fitness",
"experienceYears": 6,
"hourlyFee": 250000,
"bio": "Professional fitness trainer"
}
```

### Success

```text
200 OK
```

---

## 4.5. Approve Trainer

```http
PATCH /admin/trainers/{id}/approve
```

### Authentication

```text
ADMIN
```

### Description

Approve a Trainer profile after reviewing their information.

### Success

```text
200 OK
```

```json
{
  "id": 5,
  "status": "ACTIVE",
  "approvedBy": 1,
  "approvedAt": "2026-09-08T10:00:00"
}
```
### Business Rules
- Trainer profile must exist.
- Trainer must not already be active.
- approvedBy is set to the current admin.
- approvedAt is set to the current time.
- User status becomes ACTIVE.
---

## 4.6. Reject Trainer

```http
PATCH /admin/trainers/{id}/reject
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "reason": "Required certification is missing"
}
```

### Success

```text
200 OK
```
### Business Rules
- Trainer profile must exist.
- User status becomes REJECTED.
- The rejection reason may be included in a notification to the trainer.
- approvedBy and approvedAt remain unchanged unless business requirements specify otherwise.
---

# 5. Room APIs

## 5.1. Get Rooms

```http
GET /rooms
```

### Authentication

```text
Public
```

### Query Parameters

```text
status
page
size
```

### Success

```text
200 OK
```

---

## 5.2. Get Room Details

```http
GET /rooms/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 5.3. Create Room

```http
POST /rooms
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "name": "Room A",
  "location": "First Floor",
  "capacity": 20,
  "status": "ACTIVE"
}
```
### Validation
```text
- name: required
- location: required
- capacity > 0
- status: valid room status
```
### Success

```text
201 Created
```

---

## 5.4. Update Room

```http
PATCH /rooms/{id}
```

### Authentication

```text
ADMIN
```
### Request Body
```json
{
"name": "Room A",
"location": "Second Floor",
"capacity": 25
}
```
### Business Rules
```text
- Room must exist.
- Capacity cannot be smaller than the maxCapacity of an existing scheduled class in a way that violates current data.
- Updating a room does not automatically cancel existing classes.
```
### Success

```text
200 OK
```

---

## 5.5. Update Room Status

```http
PATCH /rooms/{id}/status
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "status": "INACTIVE"
}
```
### Valid Values
```text
ACTIVE
INACTIVE
```
---

# 6. Class Type APIs

## 6.1. Get Class Types

```http
GET /class-types
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 6.2. Get Class Type Details

```http
GET /class-types/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 6.3. Create Class Type

```http
POST /class-types
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "name": "Yoga",
  "description": "Basic yoga class",
  "isActive": true
}
```

### Success

```text
201 Created
```

---

## 6.4. Update Class Type

```http
PATCH /class-types/{id}
```

### Authentication

```text
ADMIN
```
### Request Body

```json
{
  "name": "Yoga",
  "description": "Basic yoga class",
  "isActive": true
}
```
### Success

```text
200 OK
```

---

# 7. Gym Class APIs

## 7.1. Get Class List

```http
GET /classes
```

### Authentication

```text
Public
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number |
| `size` | Integer | No | Number of records |
| `classTypeId` | Long | No | Filter by class type |
| `trainerId` | Long | No | Filter by trainer |
| `roomId` | Long | No | Filter by room |
| `status` | String | No | Filter by class status |
| `from` | DateTime | No | Start of time range |
| `to` | DateTime | No | End of time range |
| `keyword` | String | No | Search by class title |

### Success

```text
200 OK
```

---

## 7.2. Get Class Details

```http
GET /classes/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 7.3. Create Class

```http
POST /classes
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "classTypeId": 1,
  "trainerId": 5,
  "roomId": 2,
  "title": "Morning Yoga",
  "maxCapacity": 20,
  "startTime": "2026-09-10T08:00:00",
  "endTime": "2026-09-10T09:00:00"
}
```

### Business Rules
```text
- Class type must exist and be active.
- Trainer must exist and be active.
- Room must exist and be active.
- startTime must be before endTime.
- Room cannot have another class with overlapping time.
- Trainer cannot have another class with overlapping time.
- maxCapacity > 0.
- maxCapacity cannot exceed room capacity.
- currentCount is initialized to 0.
- Class status is initialized according to the system's default class status.
```
### Success

```text
201 Created
```

---

## 7.4. Update Class

```http
PATCH /classes/{id}
```

### Authentication

```text
ADMIN
```
### Request Body
```json
{
"title": "Morning Yoga Advanced",
"roomId": 2,
"trainerId": 5,
"maxCapacity": 20,
"startTime": "2026-09-10T08:00:00",
"endTime": "2026-09-10T09:00:00"
}
```
### Business Rules
```text
- Same conflict rules as class creation.
- Cannot update a cancelled class.
- Cannot reduce maxCapacity below the current booking count.
- Existing bookings remain associated with the same class.
```
### Success

```text
200 OK
```

---

## 7.5. Cancel Class

```http
PATCH /classes/{id}/cancel
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "reason": "Trainer unavailable"
}
```
### Business Rules
```text
- Class must exist.
- Class cannot already be cancelled.
- Class status becomes CANCELLED.
- Existing confirmed bookings should be handled according to the cancellation policy.
- Members should receive notifications.
- If package sessions were consumed, they should be restored according to the cancellation policy.
```
### Success

```text
200 OK
```

---

## 7.6. Get Class Bookings

```http
GET /classes/{classId}/bookings
```

### Authentication

```text
TRAINER / ADMIN
```

### Authorization

- `TRAINER`: Only assigned classes
- `ADMIN`: All classes

### Success

```text
200 OK
```

---

# 8. Trainer Time Slot APIs

## 8.1. Get Available Time Slots

```http
GET /trainers/{trainerId}/time-slots
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Query Parameters

```text
from
to
status
```

### Success

```text
200 OK
```

```json
{
  "content": [
    {
      "id": 20,
      "startTime": "2026-09-10T14:00:00",
      "endTime": "2026-09-10T15:00:00",
      "status": "AVAILABLE"
    }
  ]
}
```

---

## 8.2. Create Time Slot

```http
POST /trainers/time-slots
```

### Authentication

```text
TRAINER
```

### Request Body

```json
{
  "startTime": "2026-09-10T14:00:00",
  "endTime": "2026-09-10T15:00:00"
}
```

### Business Rules
```text
- Trainer is determined from authenticated user.
- startTime < endTime.
- Time slot cannot overlap another time slot belonging to the same trainer.
- Time slot cannot be created in the past.
- Initial status is AVAILABLE.
```
### Success

```text
201 Created
```

---

## 8.3. Update Time Slot

```http
PATCH /trainers/time-slots/{id}
```

### Authentication

```text
TRAINER
```

### Request Body
```json
{
"startTime": "2026-09-10T15:00:00",
"endTime": "2026-09-10T16:00:00"
}
```
### Business Rules
```text
- Trainer can update only their own time slots.
- A booked time slot cannot be changed.
- Time slot cannot overlap another time slot of the same trainer.
- startTime < endTime.
- Past time slots cannot be modified.
```
### Success

```text
200 OK
```

---

## 8.4. Deactivate Time Slot

```http
PATCH /trainers/time-slots/{id}/deactivate
```

### Authentication

```text
TRAINER
```
### Business Rules
```text
- Trainer can deactivate only their own time slots.
- A booked time slot cannot be deactivated unless cancellation policy allows it.
```
### Success

```text
200 OK
```

---

# 9. Class Booking APIs

## 9.1. Book a Class

```http
POST /class-bookings
```

### Authentication

```text
MEMBER
```

### Request Body

```json
{
  "gymClassId": 1,
  "memberPackageId": 10
}
```

### Business Rules
- Member package must belong to current member.
- Member package must be ACTIVE.
- Current date must be within package validity period.
- sessionsRemaining > 0.
- Gym class must exist.
- Gym class must allow booking.
- Class must not have started.
- Class must have available capacity.
- Member cannot have another active booking for the same class.
- One package session is consumed.
- currentCount increases by 1.
- Booking status becomes CONFIRMED.
- Attendance status becomes NOT_MARKED.
- All operations must be transactional.

### Success

```text
201 Created
```

```json
{
  "id": 100,
  "status": "CONFIRMED",
  "attendanceStatus": "NOT_MARKED",
  "bookedAt": "2026-09-06T10:30:00"
}
```

---

## 9.2. Get My Class Bookings

```http
GET /class-bookings/me
```

### Authentication

```text
MEMBER
```

### Query Parameters

```text
page
size
status
from
to
```

### Success

```text
200 OK
```

---

## 9.3. Get Booking Details

```http
GET /class-bookings/{id}
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Authorization

- `MEMBER`: Own bookings only
- `TRAINER`: Bookings of assigned classes
- `ADMIN`: All bookings

### Success

```text
200 OK
```

---

## 9.4. Cancel Class Booking

```http
PATCH /class-bookings/{id}/cancel
```

### Authentication

```text
MEMBER
```

### Request Body

```json
{
  "cancelReason": "Personal reason"
}
```

### Business Rules
- Member can cancel only their own booking.
- Booking must be CONFIRMED.
- Class must not have started.
- Booking status becomes CANCELLED.
- cancelledAt is set.
- cancelReason is saved.
- One package session is restored.
- currentCount decreases by 1.
- All operations must be transactional.

### Success

```text
200 OK
```

---

## 9.5. Get All Class Bookings

```http
GET /class-bookings
```

### Authentication

```text
TRAINER / ADMIN
```

### Query Parameters

```text
page
size
gymClassId
memberId
trainerId
status
attendanceStatus
from
to
```

### Authorization

- `TRAINER`: Assigned classes only
- `ADMIN`: All bookings

### Success

```text
200 OK
```

---

## 9.6. Update Attendance

```http
PATCH /class-bookings/{id}/attendance
```

### Authentication

```text
TRAINER / ADMIN
```

### Request Body

```json
{
  "attendanceStatus": "PRESENT"
}
```

### Valid Values

```text
NOT_MARKED
PRESENT
ABSENT
```

### Authorization

- `TRAINER`: Assigned classes only
- `ADMIN`: All classes

### Success

```text
200 OK
```

---

# 10. PT Booking APIs

## 10.1. Create PT Booking

```http
POST /pt-bookings
```

### Authentication

```text
MEMBER
```

### Request Body

```json
{
  "trainerId": 5,
  "timeSlotId": 20,
  "memberPackageId": 10,
  "sessionNote": "Improve strength and endurance",
  "healthNote": "No specific issue"
}
```

### Business Rules

- Trainer must exist and be active.
- Time slot must belong to the selected Trainer.
- Time slot must be `AVAILABLE`.
- Member package must belong to the current Member.
- Package must be active and not expired.
- Package must have remaining sessions.
- Time slot cannot be booked by another Member.
- One package session is consumed only when the booking is confirmed according to the business flow.
- Booking creation and package update must be transactional.

### Success

```text
201 Created
```

```json
{
  "id": 200,
  "trainerId": 5,
  "timeSlotId": 20,
  "status": "PENDING",
  "attendanceStatus": "NOT_MARKED",
  "bookedAt": "2026-09-06T10:30:00"
}
```

---

## 10.2. Get My PT Bookings

```http
GET /pt-bookings/me
```

### Authentication

```text
MEMBER
```

### Query Parameters

```text
page
size
status
from
to
```

### Success

```text
200 OK
```

---

## 10.3. Get PT Booking Details

```http
GET /pt-bookings/{id}
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Authorization

- `MEMBER`: Own bookings only
- `TRAINER`: Their own PT bookings
- `ADMIN`: All PT bookings

### Success

```text
200 OK
```

---

## 10.4. Confirm PT Booking

```http
PATCH /pt-bookings/{id}/confirm
```

### Authentication

```text
TRAINER
```

### Authorization

Trainer can confirm only bookings assigned to them.

### Success

```text
200 OK
```

---

## 10.5. Reject PT Booking

```http
PATCH /pt-bookings/{id}/reject
```

### Authentication

```text
TRAINER
```

### Request Body

```json
{
  "rejectReason": "Trainer is unavailable at this time"
}
```

### Success

```text
200 OK
```

---

## 10.6. Cancel PT Booking

```http
PATCH /pt-bookings/{id}/cancel
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Request Body

```json
{
  "cancelReason": "Personal reason"
}
```

### Business Rules

- User must have permission to cancel the booking.
- Booking must be cancellable.
- Cancelled booking cannot be cancelled again.
- If a package session was consumed, it must be restored according to the cancellation policy.
- Time slot becomes available again when appropriate.

### Success

```text
200 OK
```

---

## 10.7. Update PT Attendance

```http
PATCH /pt-bookings/{id}/attendance
```

### Authentication

```text
TRAINER / ADMIN
```

### Request Body

```json
{
  "attendanceStatus": "PRESENT"
}
```

### Valid Values

```text
NOT_MARKED
PRESENT
ABSENT
```

### Success

```text
200 OK
```

---

## 10.8. Get PT Bookings for Trainer

```http
GET /pt-bookings/trainer/me
```

### Authentication

```text
TRAINER
```

### Query Parameters

```text
page
size
status
from
to
```

### Success

```text
200 OK
```

---

# 11. Package APIs

## 11.1. Get Available Packages

```http
GET /packages
```

### Authentication

```text
Public
```

### Query Parameters

```text
page
size
isActive
```

### Success

```text
200 OK
```

---

## 11.2. Get Package Details

```http
GET /packages/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 11.3. Create Package

```http
POST /packages
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "name": "Premium 20 Sessions",
  "description": "20 training sessions",
  "price": 2000000,
  "durationDays": 90,
  "sessionCount": 20,
  "isActive": true
}
```

### Success

```text
201 Created
```

---

## 11.4. Update Package

```http
PATCH /packages/{id}
```

### Authentication

```text
ADMIN
```

### Success

```text
200 OK
```

---

## 11.5. Deactivate Package

```http
PATCH /packages/{id}/deactivate
```

### Authentication

```text
ADMIN
```

### Success

```text
200 OK
```

---

# 12. Member Package APIs

## 12.1. Buy Package

```http
POST /member-packages
```

### Authentication

```text
MEMBER
```

### Request Body

```json
{
  "packageId": 1,
  "paymentMethod": "MOCK"
}
```

### Business Rules

- Package must exist and be active.
- A MemberPackage is created for the current member.
- `startDate` is the purchase/start date.
- `endDate` is calculated from `durationDays`.
- `sessionsRemaining` is initialized from `sessionCount`.
- A Transaction is created for the payment.

### Success

```text
201 Created
```

```json
{
  "memberPackageId": 10,
  "packageId": 1,
  "startDate": "2026-09-07",
  "endDate": "2026-12-06",
  "sessionsRemaining": 20,
  "status": "ACTIVE",
  "transactionCode": "TXN-20260907001"
}
```

---

## 12.2. Get My Packages

```http
GET /member-packages/me
```

### Authentication

```text
MEMBER
```

### Query Parameters

```text
page
size
status
```

### Success

```text
200 OK
```

---

## 12.3. Get Member Package Details

```http
GET /member-packages/{id}
```

### Authentication

```text
MEMBER / ADMIN
```

### Authorization

- `MEMBER`: Own packages only
- `ADMIN`: All packages

### Success

```text
200 OK
```

---

## 12.4. Get Member Packages

```http
GET /member-packages
```

### Authentication

```text
ADMIN
```

### Query Parameters

```text
memberId
packageId
status
page
size
```

### Success

```text
200 OK
```

---

# 13. Transaction APIs

## 13.1. Get My Transactions

```http
GET /transactions/me
```

### Authentication

```text
MEMBER
```

### Query Parameters

```text
page
size
status
paymentMethod
```

### Success

```text
200 OK
```

---

## 13.2. Get Transaction Details

```http
GET /transactions/{id}
```

### Authentication

```text
MEMBER / ADMIN
```

### Authorization

- `MEMBER`: Own transactions only
- `ADMIN`: All transactions

### Success

```text
200 OK
```

---

## 13.3. Get All Transactions

```http
GET /transactions
```

### Authentication

```text
ADMIN
```

### Query Parameters

```text
memberId
memberPackageId
status
paymentMethod
from
to
page
size
```

### Success

```text
200 OK
```

---

## 13.4. Update Transaction Status

```http
PATCH /transactions/{id}/status
```

### Authentication

```text
ADMIN
```

### Request Body

```json
{
  "status": "SUCCESS"
}
```

### Valid Values

```text
PENDING
SUCCESS
FAILED
```

### Success

```text
200 OK
```

---

# 14. Review APIs

## 14.1. Create Review

```http
POST /reviews
```

### Authentication

```text
MEMBER
```

### Request Body

For class:

```json
{
  "classBookingId": 100,
  "rating": 5,
  "comment": "The class was very good."
}
```

For PT:

```json
{
  "ptBookingId": 200,
  "rating": 5,
  "comment": "The trainer was very helpful."
}
```

### Business Rules

- Member can review only their own completed booking.
- A review must reference either `classBookingId` or `ptBookingId`.
- Rating must be from `1` to `5`.
- One booking can have at most one review.
- Hidden reviews are not displayed publicly.

### Success

```text
201 Created
```

---

## 14.2. Get Reviews

```http
GET /reviews
```

### Authentication

```text
Public
```

### Query Parameters

```text
memberId
classBookingId
ptBookingId
rating
page
size
```

### Success

```text
200 OK
```

---

## 14.3. Get Review Details

```http
GET /reviews/{id}
```

### Authentication

```text
Public
```

### Success

```text
200 OK
```

---

## 14.4. Hide Review

```http
PATCH /reviews/{id}/hide
```

### Authentication

```text
ADMIN
```

### Success

```text
200 OK
```

---

## 14.5. Show Review

```http
PATCH /reviews/{id}/show
```

### Authentication

```text
ADMIN
```

### Success

```text
200 OK
```

---

# 15. Chat APIs

## 15.1. Get Conversations

```http
GET /chat/conversations
```

### Authentication

```text
MEMBER / TRAINER
```

### Description

Get conversations involving the current user.

### Success

```text
200 OK
```

---

## 15.2. Get Messages

```http
GET /chat/conversations/{userId}/messages
```

### Authentication

```text
MEMBER / TRAINER
```

### Description

Get messages between the current user and another user.

### Query Parameters

```text
page
size
before
```

### Success

```text
200 OK
```

```json
{
  "content": [
    {
      "id": 1,
      "senderId": 1,
      "receiverId": 5,
      "content": "Hello Trainer",
      "imageUrl": null,
      "sentAt": "2026-09-07T10:00:00",
      "readAt": null
    }
  ]
}
```

---

## 15.3. Send Message

```http
POST /chat/messages
```

### Authentication

```text
MEMBER / TRAINER
```

### Request Body

```json
{
  "receiverId": 5,
  "content": "Hello Trainer",
  "imageUrl": null
}
```

### Validation

- Sender must be authenticated.
- Receiver must exist.
- Member can chat with Trainer.
- Trainer can chat with Member.
- At least one of `content` or `imageUrl` must be provided.

### Success

```text
201 Created
```

---

## 15.4. Mark Message as Read

```http
PATCH /chat/messages/{id}/read
```

### Authentication

```text
MEMBER / TRAINER
```

### Success

```text
200 OK
```

---

# 16. Progress Note APIs

## 16.1. Get Member Progress Notes

```http
GET /members/{memberId}/progress-notes
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Authorization

- `MEMBER`: Own notes only
- `TRAINER`: Members they train
- `ADMIN`: All members

### Success

```text
200 OK
```

---

## 16.2. Create Progress Note

```http
POST /progress-notes
```

### Authentication

```text
TRAINER
```

### Request Body

```json
{
  "memberId": 1,
  "content": "Member improved squat technique and endurance."
}
```

### Success

```text
201 Created
```

---

## 16.3. Update Progress Note

```http
PATCH /progress-notes/{id}
```

### Authentication

```text
TRAINER
```

### Authorization

Trainer can update only notes created by themselves.

### Request Body

```json
{
  "content": "Updated progress note."
}
```

### Success

```text
200 OK
```

---

## 16.4. Delete Progress Note

```http
DELETE /progress-notes/{id}
```

### Authentication

```text
TRAINER / ADMIN
```

### Success

```text
204 No Content
```

---

# 17. Notification APIs

## 17.1. Get My Notifications

```http
GET /notifications/me
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Query Parameters

```text
page
size
isRead
type
```

### Success

```text
200 OK
```

---

## 17.2. Get Unread Notification Count

```http
GET /notifications/me/unread-count
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Success

```text
200 OK
```

```json
{
  "unreadCount": 5
}
```

---

## 17.3. Mark Notification as Read

```http
PATCH /notifications/{id}/read
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Authorization

User can mark only their own notification as read.

### Success

```text
200 OK
```

---

## 17.4. Mark All Notifications as Read

```http
PATCH /notifications/me/read-all
```

### Authentication

```text
MEMBER / TRAINER / ADMIN
```

### Success

```text
200 OK
```

---

# 18. API Authorization Summary

| Module | Public | MEMBER | TRAINER | ADMIN |
|---|---|---|---|---|
| Authentication | ✓ | ✓ | ✓ | ✓ |
| User Profile | | ✓ | ✓ | ✓ |
| User Management | | | | ✓ |
| Trainer List | ✓ | ✓ | ✓ | ✓ |
| Trainer Approval | | | | ✓ |
| Rooms | ✓ | | | ✓ |
| Class Types | ✓ | | | ✓ |
| Gym Classes | ✓ | ✓ | ✓ | ✓ |
| Trainer Time Slots | | ✓ | ✓ | ✓ |
| Class Booking | | ✓ | | ✓ |
| PT Booking | | ✓ | ✓ | ✓ |
| Packages | ✓ | ✓ | ✓ | ✓ |
| Member Packages | | ✓ | | ✓ |
| Transactions | | ✓ | | ✓ |
| Reviews | ✓ | ✓ | | ✓ |
| Chat | | ✓ | ✓ | |
| Progress Notes | | ✓ | ✓ | ✓ |
| Notifications | | ✓ | ✓ | ✓ |

---

# 19. Common Response Format

Successful responses should return the appropriate HTTP status code and response data.

For validation errors:

```text
400 Bad Request
```

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "timestamp": "2026-09-07T10:30:00"
}
```

For authentication errors:

```text
401 Unauthorized
```

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication is required",
  "timestamp": "2026-09-07T10:30:00"
}
```

For authorization errors:

```text
403 Forbidden
```

```json
{
  "code": "FORBIDDEN",
  "message": "You do not have permission to access this resource",
  "timestamp": "2026-09-07T10:30:00"
}
```

For resource not found:

```text
404 Not Found
```

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Requested resource was not found",
  "timestamp": "2026-09-07T10:30:00"
}
```

For business conflicts:

```text
409 Conflict
```

```json
{
  "code": "BUSINESS_CONFLICT",
  "message": "The requested operation cannot be completed",
  "timestamp": "2026-09-07T10:30:00"
}
```

---

# 20. Common Business Rules

1. All protected APIs require a valid authentication token.
2. Access control is based on the user's role.
3. `MEMBER` can access only their own personal data.
4. `TRAINER` can access only data related to their assigned members/classes.
5. `ADMIN` has management access to the entire system.
6. Passwords must never be returned by any API.
7. Authentication tokens must not be stored in the database as plain text.
8. Booking operations involving package sessions and class capacity must be transactional.
9. A package cannot be used after expiration.
10. A package cannot be used when `sessionsRemaining <= 0`.
11. A class cannot exceed its `maxCapacity`.
12. A PT time slot can only be booked once.
13. A Member cannot create duplicate active bookings for the same class.
14. Reviews can only be created for eligible completed bookings.
15. Users can only read and modify resources for which they have permission.
16. Sensitive authentication information must not be exposed through API responses.

---

# 21. Important ERD Consistency Rules

Because `phone` or `address` is used as the login username, both fields should be unique in the database.

Recommended constraints:

```text
User.phone    -> UQ
User.address  -> UQ
User.email    -> UQ
```

The login API searches the submitted `username` against:

```text
User.phone
OR
User.address
```

Example:

```text
username = "0901234567"
        |
        +--> User.phone

username = "user@example.com"
        |
        +--> User.address
```

The system should not require a separate `username` column because the existing `phone` and `address` fields already provide the two supported login identifiers.

---

# 22. API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login using phone or address |
| POST | `/auth/register` | Public | Register Member |
| GET | `/auth/me` | All authenticated | Get current user |
| POST | `/auth/logout` | All authenticated | Logout |
| GET | `/users/me` | All authenticated | Get own profile |
| PATCH | `/users/me` | All authenticated | Update own profile |
| PATCH | `/users/me/password` | All authenticated | Change password |
| GET | `/users` | ADMIN | Get users |
| PATCH | `/users/{id}/status` | ADMIN | Update user status |
| GET | `/trainers` | Public | Get trainer list |
| GET | `/trainers/{id}` | Public | Get trainer details |
| POST | `/trainers/profile` | TRAINER | Create trainer profile |
| PATCH | `/trainers/profile` | TRAINER | Update trainer profile |
| PATCH | `/admin/trainers/{id}/approve` | ADMIN | Approve trainer |
| PATCH | `/admin/trainers/{id}/reject` | ADMIN | Reject trainer |
| GET | `/rooms` | Public | Get rooms |
| GET | `/rooms/{id}` | Public | Get room details |
| POST | `/rooms` | ADMIN | Create room |
| PATCH | `/rooms/{id}` | ADMIN | Update room |
| PATCH | `/rooms/{id}/status` | ADMIN | Update room status |
| GET | `/class-types` | Public | Get class types |
| GET | `/class-types/{id}` | Public | Get class type details |
| POST | `/class-types` | ADMIN | Create class type |
| PATCH | `/class-types/{id}` | ADMIN | Update class type |
| GET | `/classes` | Public | Get class list |
| GET | `/classes/{id}` | Public | Get class details |
| POST | `/classes` | ADMIN | Create class |
| PATCH | `/classes/{id}` | ADMIN | Update class |
| PATCH | `/classes/{id}/cancel` | ADMIN | Cancel class |
| GET | `/classes/{classId}/bookings` | TRAINER / ADMIN | Get class bookings |
| GET | `/trainers/{trainerId}/time-slots` | MEMBER / TRAINER / ADMIN | Get trainer time slots |
| POST | `/trainers/time-slots` | TRAINER | Create time slot |
| PATCH | `/trainers/time-slots/{id}` | TRAINER | Update time slot |
| PATCH | `/trainers/time-slots/{id}/deactivate` | TRAINER | Deactivate time slot |
| POST | `/class-bookings` | MEMBER | Book group class |
| GET | `/class-bookings/me` | MEMBER | Get own class bookings |
| GET | `/class-bookings/{id}` | MEMBER / TRAINER / ADMIN | Get booking details |
| PATCH | `/class-bookings/{id}/cancel` | MEMBER | Cancel class booking |
| GET | `/class-bookings` | TRAINER / ADMIN | Get class bookings |
| PATCH | `/class-bookings/{id}/attendance` | TRAINER / ADMIN | Update attendance |
| POST | `/pt-bookings` | MEMBER | Create PT booking |
| GET | `/pt-bookings/me` | MEMBER | Get own PT bookings |
| GET | `/pt-bookings/{id}` | MEMBER / TRAINER / ADMIN | Get PT booking details |
| PATCH | `/pt-bookings/{id}/confirm` | TRAINER | Confirm PT booking |
| PATCH | `/pt-bookings/{id}/reject` | TRAINER | Reject PT booking |
| PATCH | `/pt-bookings/{id}/cancel` | MEMBER / TRAINER / ADMIN | Cancel PT booking |
| PATCH | `/pt-bookings/{id}/attendance` | TRAINER / ADMIN | Update PT attendance |
| GET | `/pt-bookings/trainer/me` | TRAINER | Get trainer's PT bookings |
| GET | `/packages` | Public | Get available packages |
| GET | `/packages/{id}` | Public | Get package details |
| POST | `/packages` | ADMIN | Create package |
| PATCH | `/packages/{id}` | ADMIN | Update package |
| PATCH | `/packages/{id}/deactivate` | ADMIN | Deactivate package |
| POST | `/member-packages` | MEMBER | Purchase package |
| GET | `/member-packages/me` | MEMBER | Get own packages |
| GET | `/member-packages/{id}` | MEMBER / ADMIN | Get package details |
| GET | `/member-packages` | ADMIN | Get all member packages |
| GET | `/transactions/me` | MEMBER | Get own transactions |
| GET | `/transactions/{id}` | MEMBER / ADMIN | Get transaction details |
| GET | `/transactions` | ADMIN | Get all transactions |
| PATCH | `/transactions/{id}/status` | ADMIN | Update transaction status |
| POST | `/reviews` | MEMBER | Create review |
| GET | `/reviews` | Public | Get reviews |
| GET | `/reviews/{id}` | Public | Get review details |
| PATCH | `/reviews/{id}/hide` | ADMIN | Hide review |
| PATCH | `/reviews/{id}/show` | ADMIN | Show review |
| GET | `/chat/conversations` | MEMBER / TRAINER | Get conversations |
| GET | `/chat/conversations/{userId}/messages` | MEMBER / TRAINER | Get messages |
| POST | `/chat/messages` | MEMBER / TRAINER | Send message |
| PATCH | `/chat/messages/{id}/read` | MEMBER / TRAINER | Mark message as read |
| GET | `/members/{memberId}/progress-notes` | MEMBER / TRAINER / ADMIN | Get progress notes |
| POST | `/progress-notes` | TRAINER | Create progress note |
| PATCH | `/progress-notes/{id}` | TRAINER | Update progress note |
| DELETE | `/progress-notes/{id}` | TRAINER / ADMIN | Delete progress note |
| GET | `/notifications/me` | All authenticated | Get notifications |
| GET | `/notifications/me/unread-count` | All authenticated | Get unread count |
| PATCH | `/notifications/{id}/read` | All authenticated | Mark notification as read |
| PATCH | `/notifications/me/read-all` | All authenticated | Mark all as read |