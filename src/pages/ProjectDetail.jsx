import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";
import { formatDate, isOverdue, getStatusBadgeClass, getPriorityColor, getPriorityBg } from "../utils/helpers";

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProject(); }, [id]);

  async function fetchProject() {
    try {
      const { data: proj, error } = await supabase
        .from("projects")
        .select("*, creator:users!projects_created_by_fkey(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setProject(proj);

      const [{ data: t, error: te }, { data: pm }] = await Promise.all([
        supabase.from("tasks").select("*, assignee:users!tasks_assigned_to_fkey(name, email)").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("project_members").select("user:users(id, name, email, role)").eq("project_id", id),
      ]);
      if (te) throw te;
      setTasks(t || []);
      setMembers((pm || []).map(m => m.user).filter(Boolean));
    } catch (e) {
      toast(e.message, "error");
      navigate("/projects");
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

  if (!project) return null;

  const total = tasks.length;
  const done = tasks.filter(t => t.status === "Done").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "var(--text-muted)" }}>
          <Link to="/projects" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Projects</Link>
          <span>/</span>
          <span style={{ color: "var(--text-primary)" }}>{project.title}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
            {project.title}
          </h1>
          {project.description && (
            <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              {project.description}
            </p>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
            <span>Created by <strong style={{ color: "var(--text-secondary)" }}>{project.creator?.name}</strong></span>
            <span>on {formatDate(project.created_at)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="card" style={{ padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Project Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
            {[
              { label: "Total", value: total, color: "var(--text-primary)" },
              { label: "Done", value: done, color: "var(--success)" },
              { label: "In Progress", value: inProgress, color: "#818cf8" },
              { label: "To Do", value: total - done - inProgress, color: "var(--warning)" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="card" style={{ padding: "14px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Team:</span>
              {members.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-hover)", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: "var(--accent-dim)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "var(--accent)",
                  }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: "var(--text-secondary)" }}>{m.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({m.role})</span>
                </div>
              ))}
              {isAdmin && (
                <Link to={`/projects`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", marginLeft: "auto" }}>
                  Manage members →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Tasks
          </h2>
          {isAdmin && (
            <Link to={`/tasks?project=${id}`} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              + Add Task
            </Link>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="card empty-state" style={{ padding: 48 }}>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>No tasks in this project yet.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {tasks.map(task => {
              const overdue = isOverdue(task.due_date, task.status);
              const badgeClass = getStatusBadgeClass(task.status, overdue);

              return (
                <div key={task.id} className="table-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{task.title}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {task.priority && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                          color: getPriorityColor(task.priority),
                          background: getPriorityBg(task.priority),
                          textTransform: "uppercase",
                        }}>
                          {task.priority}
                        </span>
                      )}
                      {task.description && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{task.description.slice(0, 60)}{task.description.length > 60 ? "..." : ""}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {task.assignee && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{task.assignee.name}</span>
                    )}
                    <span className={`badge ${badgeClass}`}>
                      {overdue ? "Overdue" : task.status}
                    </span>
                    <span style={{ fontSize: 12, color: overdue ? "var(--danger)" : "var(--text-muted)" }}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
