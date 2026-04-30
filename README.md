# TaskFlow — Team Task Manager

A full-stack team task management app built with React + Vite + Supabase.

## Features

- **Authentication** — Signup / Login / Logout via Supabase Auth
- **Projects** — Create, edit, delete projects (Admin only); admin can add/remove members per project
- **Tasks** — Full CRUD, assign to team members, priority (Low/Medium/High), status (To Do/In Progress/Done), due dates
- **Dashboard** — Live stats (total, done, in progress, to do, overdue), completion chart, tasks per user breakdown, projects overview
- **Role-Based Access** — Admins manage everything; Members view/update their assigned tasks only
- **Members Page** — Admin-only: view team, change roles (admin ↔ member)
- **Filters** — Filter tasks by status, priority, project, search
- **Overdue Detection** — Automatic overdue badge when due date is passed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | CSS Variables (custom dark theme) |
| Backend | Supabase (PostgreSQL + REST API) |
| Auth | Supabase Auth |
| Routing | React Router DOM v6 |
| Deployment | Railway / Vercel |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager
cd team-task-manager
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the following schema:

```sql
-- Users table (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  role text default 'member',
  created_at timestamp default now()
);

-- Projects table
create table projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  created_by uuid references users(id),
  created_at timestamp default now()
);

-- Project members (many-to-many: admin adds members per project)
create table project_members (
  id bigint generated always as identity primary key,
  project_id bigint references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  unique(project_id, user_id)
);

-- Tasks table
create table tasks (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  status text default 'To Do',      -- 'To Do', 'In Progress', 'Done'
  priority text default 'Medium',   -- 'Low', 'Medium', 'High'
  due_date date,
  assigned_to uuid references users(id),
  project_id bigint references projects(id) on delete set null,
  created_at timestamp default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'member')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

3. Enable Row Level Security (optional but recommended for production)
4. In Supabase → Authentication → Providers: enable **Email** provider
5. In Supabase → Authentication → Settings: disable **"Confirm email"** for development

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> ⚠️ Use the **Publishable (anon) key**, NOT the secret key. Find it in Supabase → Settings → API.

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## Making Yourself Admin

After signing up, go to Supabase → Table Editor → `users` → find your row → change `role` to `admin`.

## Role Permissions

| Feature | Admin | Member |
|---------|-------|--------|
| Create/Edit/Delete Projects | ✅ | ❌ |
| Add/Remove Project Members | ✅ | ❌ |
| View Assigned Projects | ✅ | ✅ |
| Create/Delete Tasks | ✅ | ❌ |
| Assign Tasks + Set Priority | ✅ | ❌ |
| Update Task Status | ✅ | ✅ (own tasks) |
| Edit Own Tasks | ✅ | ✅ (own tasks) |
| View Members Page | ✅ | ❌ |
| Change Member Roles | ✅ | ❌ |
| Dashboard — Tasks per User | ✅ | ❌ |

## Task Statuses & Priorities

**Statuses:** To Do → In Progress → Done  
**Priorities:** Low, Medium, High (color-coded green/yellow/red)

## Deployment

### Railway (Recommended — as per assignment)

1. Push your project to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in Railway dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Railway auto-detects Vite and deploys

### Vercel (Alternative)

```bash
npm run build
```

1. Push to GitHub → connect to [vercel.com](https://vercel.com)
2. Add env vars → Deploy!

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # Main layout with sidebar
│   ├── Sidebar.jsx         # Navigation sidebar
│   ├── Modal.jsx           # Reusable modal
│   ├── ConfirmDelete.jsx   # Delete confirmation modal
│   └── Spinner.jsx         # Loading spinner
├── context/
│   ├── AuthContext.jsx     # Auth state + helpers
│   └── ToastContext.jsx    # Global toast notifications
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx       # Stats + tasks per user + overview
│   ├── Projects.jsx        # Project CRUD + member management
│   ├── ProjectDetail.jsx   # Single project + its tasks + team
│   ├── Tasks.jsx           # Task CRUD + priority + filters
│   ├── Members.jsx         # Team management (admin)
│   └── NotFound.jsx
├── routes/
│   └── ProtectedRoute.jsx  # Auth guard
├── services/
│   └── supabase.js         # Supabase client
├── utils/
│   └── helpers.js          # Date formatting, status/priority helpers
├── App.jsx                 # Routes
└── main.jsx
```

## License

MIT
