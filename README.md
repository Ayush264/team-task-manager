# TaskFlow - Team Task Manager

TaskFlow is a full-stack team collaboration and task management application built using React, Vite, and Supabase.

The application allows teams to manage projects collaboratively, assign tasks to members, and track progress through a centralized dashboard.

---
## Live Demo
https://team-task-manager-production-b8a3.up.railway.app

## Features

### Authentication
- User signup and login
- Supabase authentication
- Protected routes

### Projects
- Create and manage projects
- Add/remove project members
- Admin-based project control

### Tasks
- Create tasks with:
  - title
  - description
  - due date
  - priority
  - status
- Assign tasks to users
- Update task progress

### Dashboard
- Total tasks count
- Tasks by status
- Overdue tasks
- Completion progress

### Role-Based Access
Admin:
- Manage projects
- Manage users
- Create/update/delete tasks

Member:
- View assigned tasks
- Update task status

---

## Tech Stack

Frontend:
- React
- Vite
- React Router

Backend:
- Supabase
- PostgreSQL

Authentication:
- Supabase Auth

Deployment:
- Railway

---

## Local Setup

Clone the repository:

```bash
git clone https://github.com/Ayush264/team-task-manager.git
```

Install dependencies:

```bash
npm install
```

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Start development server:

```bash
npm run dev
```

---

## Database Schema

The project uses the following main tables:

- users
- projects
- tasks
- project_members

Relationships are handled using foreign keys in Supabase PostgreSQL.

---

## Admin Access

After signup, change your role manually in Supabase:

Table Editor → users → role → admin

This enables:
- project creation
- task assignment
- member management

---

## Deployment

The application is deployed using Railway.

Environment variables used:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

## Project Structure

```bash
src/
 ├── components/
 ├── context/
 ├── pages/
 ├── services/
 ├── utils/
 ├── App.jsx
 └── main.jsx
```

---

## Main Functionalities Tested

- User authentication
- Role-based access
- Project creation
- Task assignment
- Status updates
- Dashboard analytics
- Responsive UI

---

## Future Improvements

- Real-time notifications
- File attachments
- Activity logs
- Drag-and-drop boards
- Team chat system

---

## Author

Ayush Jha