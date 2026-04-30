import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { formatDate, isOverdue } from "../utils/helpers";

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 13, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const overdue = isOverdue(task.due_date, task.status);
  let statusClass = "badge-pending";
  if (task.status === "Done") statusClass = "badge-completed";
  else if (task.status === "In Progress") statusClass = "badge-in-progress";
  else if (overdue) statusClass = "badge-overdue";

  return (
    <div className="table-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
          {task.project_title || "No project"}{task.priority ? ` · ${task.priority} priority` : ""}
        </p>
      </div>
      <span className={`badge ${statusClass}`}>
        {overdue ? "Overdue" : task.status}
      </span>
      <span style={{ fontSize: 12, color: overdue ? "var(--danger)" : "var(--text-muted)", flexShrink: 0 }}>
        {formatDate(task.due_date)}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState({ total: 0, done: 0, inProgress: 0, todo: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasksByUser, setTasksByUser] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      let taskQuery = supabase
        .from("tasks")
        .select("*, project:projects(title), assignee:users!tasks_assigned_to_fkey(id,name)")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        taskQuery = taskQuery.eq("assigned_to", profile?.id);
      }

      const { data: tasks = [] } = await taskQuery;
      const enriched = tasks.map(t => ({
        ...t,
        project_title: t.project?.title,
        assignee_name: t.assignee?.name,
      }));

      const total = enriched.length;
      const done = enriched.filter(t => t.status === "Done").length;
      const inProgress = enriched.filter(t => t.status === "In Progress").length;
      const todo = enriched.filter(t => t.status === "To Do").length;
      const overdue = enriched.filter(t => isOverdue(t.due_date, t.status)).length;

      setStats({ total, done, inProgress, todo, overdue });
      setRecentTasks(enriched.slice(0, 8));

      // Tasks per user (admin only)
      if (isAdmin) {
        const userMap = {};
        enriched.forEach(t => {
          if (t.assigned_to && t.assignee_name) {
            if (!userMap[t.assigned_to]) {
              userMap[t.assigned_to] = { name: t.assignee_name, total: 0, done: 0 };
            }
            userMap[t.assigned_to].total++;
            if (t.status === "Done") userMap[t.assigned_to].done++;
          }
        });
        setTasksByUser(Object.values(userMap).sort((a, b) => b.total - a.total).slice(0, 5));
      }

      const { data: projs = [] } = await supabase
        .from("projects")
        .select("*, tasks(id, status)")
        .order("created_at", { ascending: false })
        .limit(4);
      setProjects(projs);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Spinner size={36} />
      </div>
    </Layout>
  );

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "var(--text-primary)" }}>
            Good {getGreeting()}, {profile?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Here's what's happening with your team today.
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Tasks" value={stats.total} bg="var(--accent-dim)" color="var(--accent)"
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard label="Done" value={stats.done} bg="var(--success-dim)" color="var(--success)"
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="In Progress" value={stats.inProgress} bg="rgba(99,102,241,0.12)" color="#818cf8"
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <StatCard label="To Do" value={stats.todo} bg="var(--warning-dim)" color="var(--warning)"
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Overdue" value={stats.overdue} bg="var(--danger-dim)" color="var(--danger)"
            icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 24 }}>
          {/* Progress Card */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Overall Progress
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `conic-gradient(var(--accent) ${completionRate * 3.6}deg, var(--bg-hover) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", background: "var(--bg-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
                }}>
                  {completionRate}%
                </div>
              </div>
              <div>
                <p style={{ margin: "0 0 6px", color: "var(--text-muted)", fontSize: 13 }}>Completion Rate</p>
                <p style={{ margin: 0, color: "var(--text-primary)", fontSize: 14 }}>
                  <strong>{stats.done}</strong> of <strong>{stats.total}</strong> tasks done
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Done", count: stats.done, color: "var(--success)" },
                { label: "In Progress", count: stats.inProgress, color: "#818cf8" },
                { label: "To Do", count: stats.todo, color: "var(--warning)" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${stats.total > 0 ? count / stats.total * 100 : 0}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks per user (admin only) */}
          {isAdmin && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  Tasks per User
                </h3>
                <Link to="/members" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                  View team →
                </Link>
              </div>
              {tasksByUser.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                  No assigned tasks yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {tasksByUser.map(u => {
                    const pct = u.total > 0 ? Math.round(u.done / u.total * 100) : 0;
                    return (
                      <div key={u.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", background: "var(--accent-dim)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                            }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</span>
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {u.done}/{u.total} · {pct}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Recent Projects
            </h3>
            <Link to="/projects" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
              No projects yet
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {projects.map(p => {
                const total = p.tasks?.length || 0;
                const done = p.tasks?.filter(t => t.status === "Done").length || 0;
                const pct = total > 0 ? Math.round(done / total * 100) : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                    <div className="card card-glow" style={{ padding: "12px 14px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.title}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                        {done}/{total} tasks done
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Recent Tasks
            </h3>
            <Link to="/tasks" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <p style={{ margin: 0, fontSize: 14 }}>No tasks yet. <Link to="/tasks" style={{ color: "var(--accent)" }}>Create one →</Link></p>
            </div>
          ) : (
            <div>
              {recentTasks.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
