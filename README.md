# OPA Planner 📅

**OPA Planner** (Oud Papier Actie Planner) is a modern web application designed to streamline the scheduling and management of volunteers for paper collection drives. It simplifies the complex task of creating fair, rotating schedules for volunteers while managing availability, role balancing, and automated communication.

![OPA Planner Dashboard](https://github.com/jaspergeertsma/opa_app/assets/placeholder-dashboard.png) *Note: Add actual screenshot here*

## ✨ Features

- **Automated Scheduling Engine**: sophisticated algorithm to generate year-long schedules that fair-share workload across all volunteers, respecting "double shift" preferences and role rotation (Driver/Loader).
- **Volunteer Management**: Maintain a central database of volunteers with their roles, contact details, and specific availability preferences.
- **Fairness Metrics**: Real-time stats on how many shifts each volunteer has been assigned to ensure no one is overworked.
- **Role Management**: Distinguishes between critical roles like:
  - **V1/V2** (Verzamelaar / Collector)
  - **L1/L2** (Lader / Loader)
  - **R1/R2** (Reserve)
- **Email Notifications & Reminders**: Automated system to send schedule updates and reminders to volunteers (powered by Supabase/SendGrid).
- **Modern UI/UX**: A clean, responsive dashboard interface built with Tailwind CSS principles and a custom dark-green theme.

## 🛠 Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with comprehensive variable system (Tailwind-compatible utility classes).
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Edge Functions)
- **Testing/Mocking**: Built-in generic mocking layer for local development without backend dependency.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jaspergeertsma/opa_app.git
   cd opa_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_USE_MOCK=true  # Set to false to use real Supabase instance
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Local Server**
   ```bash
   npm run dev
   ```
   The app will start at `http://localhost:5173`.

## 🏗 Project Structure

```
src/
├── components/       # React components
│   ├── auth/         # Login & Authentication wrapper
│   ├── dashboard/    # Main dashboard view
│   ├── layout/       # Sidebar, Layout shell, Headers
│   ├── schedule/     # Schedule Wizard & Editor complexity
│   ├── volunteers/   # Volunteer management lists/details
│   └── common/       # Reusable UI components
├── lib/              # Core logic & utilities
│   ├── scheduler.ts  # The scheduling algorithm
│   ├── supabase.ts   # Database client
│   └── ...
├── types/            # TypeScript interfaces
└── index.css         # Global styles & theme variables
```

## 🗓 Scheduling Algorithm

The scheduler uses a multi-phase approach to ensure fairness:
1. **Saturation**: Fills empty "Worker" slots (V1, V2, L1, L2) first.
2. **Balancing**: Prioritizes volunteers with the *least* total shifts and *least* shifts in a specific role to ensure rotation.
3. **Reserves**: Fills reserve spots (R1, R2) last, tracking a weighted load (reserves count for less "workload" than active shifts).

## 📄 License

This project is proprietary software custom-built for local community paper collection management.

---

*Built with ❤️ by Jasper Geertsma*
