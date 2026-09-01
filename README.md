# 🏋️‍♂️ Gym Class Booking & Trainer Chat System
 
> A web application for gym class booking, 1-on-1 personal training sessions, and real-time communication between members and trainers.
 
[![Java](https://img.shields.io/badge/Java-Spring%20Boot-6DB33F?logo=springboot&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)](#)
[![WebSocket](https://img.shields.io/badge/Realtime-WebSocket%20%2F%20STOMP-black)](#)
[![TypeScript](https://img.shields.io/badge/Frontend-TypeScript%20%2B%20Vite-3178C6?logo=typescript&logoColor=white)](#)
 
---
 
## 📖 Overview
 
**Gym Class Booking & Trainer Chat System** is a web application designed to help gyms manage their core operations, including group class scheduling and booking, 1-on-1 personal training (PT) sessions, membership packages and simulated transactions, attendance tracking, reviews, and real-time communication between members and trainers throughout their training sessions.
 
The system follows a Layered Architecture organized by business domains, with a focus on maintainability, scalability, and practical use in small- to medium-sized gym environments.
 
## ✨ Key Features
 
### Guest 
- View gym information, available class types, and public trainer profiles.
- Register for a Member account with email/password validation and duplicate email checking.
### Member 
- Account Management: Log in/out, reset/change password, and update personal information.
- Membership Packages: Browse and purchase packages, track remaining sessions, and view transaction history using simulated payments.
- Class Schedule: View class schedules by day/week/month and search or filter by class type, time slot, and trainer.
- Group Class Booking: Book group classes with schedule conflict, class capacity, and active membership package validation.
- 1-on-1 PT Booking: Request personal training sessions with trainers based on their available time slots.
- Booking Management: Cancel or reschedule bookings according to the allowed cancellation/rescheduling policy (default: at least 24 hours in advance), with automatic session credit restoration.
- Real-time Chat: Communicate with the trainer assigned to a confirmed class or PT session and send text messages and images.
- Reviews & Ratings: Rate and review classes or trainers after completing a session.
- Notifications: Receive notifications for booking confirmations, schedule reminders, cancellations/rescheduling, and new messages.
### Trainer 
- Profile Management: Manage professional information, including specialization, experience, session fees, and working hours.
- Availability Management: Create and manage available time slots (TrainerTimeSlot).
- Group Class Management: Create, update, and cancel group classes assigned to the trainer.
- PT Booking Management: Accept or reject 1-on-1 PT booking requests from members.
- Điểm danh hội viên (present/absent) cho lớp học và buổi PT.
- Real-time Communication: Chat with members and send training-related notes.
- Member Progress Tracking: Record private progress notes and health-related information for assigned members.
### Admin
- User Management: Manage Member and Trainer accounts, including approval, account locking, and unlocking.
- Class & Schedule Management: Manage classes, gym operating hours, and schedule conflicts.
- Room Management: Manage training rooms and room capacity.
- Membership Management: Manage membership packages, configure pricing, and activate/deactivate packages.
- Transaction Management: Manage simulated transactions and invoices.
- Review Moderation: Hide or remove reviews that violate gym policies.
- Reports & Analytics: View statistics such as member count, class count, revenue, and the most-booked classes/trainers.
> 🔧 Optional Features (depending on project progress): Waitlist management when classes are full and QR code-based check-in for attendance tracking.
 
## 🏗️ System Architecture
 
The system follows a **Layered Architecture**:
 
```
Presentation Layer  →  Controller Layer  →  Service Layer  →  Repository Layer  →  Database Layer
```
 
- **Controller**: Handles HTTP requests, validates input data, and delegates requests to the Service layer.
- **Service**: Implements core business logic such as booking, simulated payments, chat, notifications, and other business operations.
- **Repository**: Handles data access using Spring Data JPA.
- **DTO**: Transfers data between layers and helps prevent direct exposure of Entity objects.

The source code follows a **domain-driven package breakdown**, with each module organized into: `controller → service → repository → entity`

Main module: 
`auth` · `user` · `trainer` · `room` · `class` · `booking` · `membership` · `payment` · `attendance` · `review` · `progress` · `chat` · `notification` · `admin`
 
### 💬 Real-time Chat Architecture
The system uses **Spring WebSocket + STOMP** to enable real-time messaging between Members and Trainers, along with a notification mechanism to notify users when new messages are received.
 
## 🗄️ Database Design
 
The database consists of 15 main entities:
 
`User` · `TrainerProfile` · `Room` · `ClassType` · `GymClass` · `TrainerTimeSlot` · `ClassBooking` · `PTBooking` · `Package` · `MemberPackage` · `Transaction` · `Review` · `ChatMessage` · `ProgressNote` · `Notification`
 
Detailed ERD, Data Dictionary, Use Case Specifications, Sequence Diagrams, Activity Diagrams, State Diagrams, and Class Diagrams are provided in the design documentation under (`/docs`).
 
### Business Status Flows
 
| Entity | Status Flow |
|---|---|
| Booking (Class/PT) | `Pending` → `Confirmed` → `Completed` / `Rejected` / `Cancelled` / `No-show` |
| GymClass | `Scheduled` → `Full` → `Completed` / `Cancelled` |
| User Account | `Pending` → `Active` → `Locked` / `Rejected` |
 
## 🧰 Technology Stack
 
| Component | Technology |
|---|---|
| Backend | Java + Spring Boot |
| Real-time chat | Spring WebSocket + STOMP |
| Database | PostgreSQL |
| Frontend | TypeScript, HTML/CSS/Bootstrap |
| Build tool (FE) | Vite (Vanilla TypeScript) |
| Frontend Libraries | `@stomp/stompjs`, `sockjs-client`, `axios` |
| Build & VCS | Maven/Gradle, Git |
| Deployment | Docker |
 
## 📁 Project Structure
 
## 🚀 Getting Started

## 📄 License
This project is developed for educational.
