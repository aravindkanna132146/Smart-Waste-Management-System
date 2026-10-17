# Smart Waste Management System

A full-stack college-level web application that helps monitor garbage bins, manage waste collection tasks, and improve city cleanliness.

**Supports UN Sustainable Development Goal 11: Sustainable Cities and Communities 🌍**

---

## Features

- **Dashboard** — Real-time statistics, charts, bins requiring attention, recent activity
- **Bin Monitoring** — Add/edit/delete bins, view fill levels, filter by status, CRUD operations
- **Smart Sensor Simulation** — Simulate sensor readings per bin or all at once (no real hardware needed)
- **Alert Management** — Automatic alerts at 70%+ fill, Warning / Critical levels, acknowledge alerts
- **Collection Management** — Create, assign, track, and complete collection tasks
- **Map View** — Leaflet / OpenStreetMap map with color-coded bin markers
- **Reports** — Summary statistics, charts, CSV export for bins / tasks / alerts
- **Settings** — Configure thresholds, simulate all sensors, view app info

---

## Technology Stack

| Layer     | Technology                                 |
|-----------|--------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS   |
| Charts    | Recharts                                   |
| Icons     | Lucide React                               |
| Map       | Leaflet + OpenStreetMap                    |
| Backend   | Node.js, Express.js, TypeScript            |
| Database  | SQLite (via Prisma ORM)                    |

---

## Project Structure

```
smart-waste-management/
  client/                   React + Vite frontend
    src/
      components/           Shared UI components (Sidebar, Toast, etc.)
      pages/                Dashboard, BinMonitoring, Alerts, etc.
      services/             API service (axios)
      types/                TypeScript interfaces
  server/                   Node.js + Express backend
    src/
      routes/               API route handlers (bins, alerts, tasks, reports, settings)
      services/             Business logic (binService, prisma client)
      middleware/           Error handler
    prisma/
      schema.prisma         Database schema
      seed.ts               Sample data seeder
  package.json              Root orchestrator
```

---

## Quick Start

### Prerequisites
- Node.js v18 or higher
- npm

### 1. Install dependencies

```bash
# In the smart-waste-management folder:
cd smart-waste-management

# Install root (concurrently)
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Set up database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Create and migrate the database
npx prisma migrate dev --name init

# Seed sample data (6 bins, alerts, tasks)
npx ts-node prisma/seed.ts

cd ..
```

### 3. Start the application

**Option A – Start both together (recommended):**
```bash
npm run dev
```

**Option B – Start separately:**
```bash
# Terminal 1 – Backend (port 5000)
cd server && npm run dev

# Terminal 2 – Frontend (port 5173)
cd client && npm run dev
```

### 4. Open the app

Visit: **http://localhost:5173**

API health check: http://localhost:5000/api/health

---

## API Endpoints

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/health                       | Server health check              |
| GET    | /api/bins                         | List all bins (filter/search)    |
| POST   | /api/bins                         | Create a new bin                 |
| GET    | /api/bins/:id                     | Get bin details                  |
| PUT    | /api/bins/:id                     | Update bin                       |
| DELETE | /api/bins/:id                     | Delete bin                       |
| POST   | /api/bins/:id/simulate            | Simulate sensor for one bin      |
| POST   | /api/bins/simulate-all            | Simulate all bins                |
| POST   | /api/bins/:id/empty               | Mark bin as emptied              |
| GET    | /api/alerts                       | List active alerts               |
| POST   | /api/alerts/:id/acknowledge       | Acknowledge an alert             |
| GET    | /api/tasks                        | List collection tasks            |
| POST   | /api/tasks                        | Create a task                    |
| PUT    | /api/tasks/:id                    | Update a task                    |
| GET    | /api/reports/summary              | Dashboard statistics             |
| GET    | /api/reports/export/bins          | Export bins CSV                  |
| GET    | /api/reports/export/tasks         | Export tasks CSV                 |
| GET    | /api/reports/export/alerts        | Export alerts CSV                |
| GET    | /api/settings                     | Get settings                     |
| PUT    | /api/settings                     | Update settings                  |

---

## Sample Data

On first run, the seed script creates:

| Bin    | Location        | Fill | Status      |
|--------|-----------------|------|-------------|
| BIN-001 | Main Gate      | 45%  | Normal      |
| BIN-002 | College Canteen | 78%  | Nearly Full |
| BIN-003 | Library Area   | 23%  | Normal      |
| BIN-004 | Parking Area   | 92%  | Full        |
| BIN-005 | Hostel Block   | 85%  | Nearly Full |
| BIN-006 | Sports Ground  | 60%  | Normal      |

---

## Status Rules

| Fill Level | Status      | Alert    |
|------------|-------------|----------|
| 0 – 69%   | Normal      | None     |
| 70 – 89%  | Nearly Full  | Warning  |
| 90 – 100% | Full        | Critical |

---

## Notes for Demo

- The app uses **simulated sensor readings** — not real IoT hardware
- Click **Simulate All Sensors** on the dashboard to randomize fill levels
- Click **Simulate Sensor** on individual bins in Bin Monitoring
- After simulation, alerts auto-generate and dashboard updates
- Use **Mark Bin Emptied** to reset a bin to 0% (does NOT happen automatically on task completion)

---

*College Project — Computer Science Department*
