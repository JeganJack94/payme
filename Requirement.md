# PayMe – Requirements Document

## 📱 Overview
**PayMe** is a mobile-first Progressive Web App (PWA) built with React, Vite, and Tailwind CSS. It allows users to create and manage invoices, purchases, and expenses with an easy-to-use interface. It also provides simple reports to analyze financial activities.

---

## 🧱 Tech Stack
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **PWA Support**: Vite PWA plugin
- **Database & Auth**: Firebase (Firestore + Authentication)
- **Charts & Reports**: Recharts or Chart.js

---

## ✅ Core Features

### 🔐 Authentication
- [ ] Email/password and Google sign-in
- [ ] Firebase Authentication integration
- [ ] Protected routes
- [ ] User profile setup (name, business info, logo)

---

### 📄 Invoice Management
- [ ] Create, Read, Update, Delete (CRUD) invoices
- [ ] Invoice fields:
  - Invoice number (auto-generated)
  - Customer name
  - Item list (description, quantity, price)
  - Issue date & Due date
  - Status (Paid, Unpaid, Overdue)
- [ ] Convert to PDF (optional)
- [ ] Share/download invoice (optional)

---

### 🧾 Purchase Management
- [ ] CRUD purchases
- [ ] Purchase fields:
  - Vendor name
  - Date
  - Amount
  - Payment method
  - Notes

---

### 💸 Expense Tracking
- [ ] CRUD expenses
- [ ] Expense fields:
  - Amount
  - Category (Food, Travel, Tools, etc.)
  - Description
  - Date

---

### 📊 Reports & Dashboard
- [ ] Summary: total income, total expenses, profit
- [ ] Charts for:
  - Monthly income vs expenses
  - Category-wise expenses
- [ ] Filters (date range, category, etc.)
- [ ] Export report (PDF/CSV - optional)

---

## 🧰 Additional Features (Optional)
- [ ] Multi-currency support
- [ ] Client & vendor contact storage
- [ ] Recurring invoices
- [ ] Notification for due invoices

---

## 🧪 Testing & QA
- [ ] Unit tests for core functions
- [ ] Manual testing on mobile browsers
- [ ] PWA installability & offline mode check

---

## 🚀 Deployment
- [ ] Host on Firebase / Vercel
- [ ] Enable HTTPS and configure service worker
- [ ] Add to home screen (A2HS) prompt
- [ ] SEO + Meta tags for sharing

---

## 🗂 Folder Structure Suggestion

/src /components /pages /services /hooks /assets /utils


---

## 📆 Development Phases (Milestones)
1. **Setup**: Vite + React + Tailwind + Firebase
2. **Auth**: User login and protected routes
3. **Billing Modules**: Invoice, purchase, expense CRUD
4. **Reports**: Dashboard and analytics
5. **PWA Enhancements**: Offline, install prompt, deploy
6. **Polishing**: UI/UX tweaks, testing, performance

---

## 📌 Notes
- Focus on clean UI with good accessibility
- Prioritize mobile-first responsive design
- Keep data structure scalable for future features

