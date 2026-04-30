import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmDelete from "../components/ConfirmDelete";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";
import { formatDate, isOverdue, getStatusBadgeClass, getPriorityColor, getPriorityBg, STATUSES, PRIORITIES } from "../utils/helpers";

function TaskForm({ initial, projects, members, onSubmit, onClose, loading, isAdmin }) {
  const [form, setForm] = useState(initial || {
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    due_date: "",
    assigned_to: "",
    project_id: "",
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.project_id) e.project_id = "Project is required";
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (!Object.keys(e).length) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Task Title *</label>
          <input
            className={`input${errors.title ? " input-error" : ""}`}
            placeholder="e.g. Design login page"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          {errors.title && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.title}</p>}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Description</label>
          <textarea
            className="input"
            placeholder="Task details..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Project *</label>
          <select
            className={`input${errors.project_id ? " input-error" : ""}`}
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
          >
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {errors.project_id && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.project_id}</p>}
        </div>

        <div>
          <label className="label">Priority</label>
          <select
            className="input"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Due Date</label>
          <input
            className="input"
            type="date"
            value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          />
        </div>

        {isAdmin && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Assign To</label>
            <select
              className="input"
              value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : initial ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}

function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
      color: getPriorityColor(priority),
      background: getPriorityBg(priority),
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {priority}
    </span>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, isAdmin, currentUserId }) {
  const overdue = isOverdue(task.due_date, task.status);
  const canEdit = isAdmin || task.assigned_to === currentUserId;
  const badgeClass = getStatusBadgeClass(task.status, overdue);

  return (
    <div className="card card-glow" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-word" }}>
            {task.title}
          </h4>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <PriorityBadge priority={task.priority} />
          </div>
          {task.description && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {task.description.slice(0, 80)}{task.description.length > 80 ? "..." : ""}
            </p>
          )}
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {isAdmin && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(task)} style={{ color: "var(--danger)" }} title="Delete">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className={`badge ${badgeClass}`}>
          {overdue ? "Overdue" : task.status}
        </span>
        {task.project_title && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 6 }}>
            {task.project_title}
          </span>
        )}
        {task.due_date && (
          <span style={{ fontSize: 12, color: overdue ? "var(--danger)" : "var(--text-muted)", marginLeft: "auto" }}>
            📅 {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {task.assignee_name && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%", background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "var(--accent)",
          }}>
            {task.assignee_name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{task.assignee_name}</span>
        </div>
      )}

      {canEdit && task.status !== "Done" && (
        <div style={{ marginTop: 12 }}>
          <select
            className="input"
            style={{ fontSize: 12, padding: "5px 10px", height: "auto" }}
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { profile, isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const defaultProject = searchParams.get("project") || "";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(!!defaultProject);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterProject, setFilterProject] = useState(defaultProject);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [{ data: t }, { data: p }, { data: m }] = await Promise.all([
        supabase.from("tasks").select("*, project:projects(title), assignee:users!tasks_assigned_to_fkey(id,name,email)").order("created_at", { ascending: false }),
        supabase.from("projects").select("id, title").order("title"),
        supabase.from("users").select("id, name, email, role").order("name"),
      ]);

      const enriched = (t || []).map(task => ({
        ...task,
        project_title: task.project?.title,
        assignee_name: task.assignee?.name,
        assignee_email: task.assignee?.email,
      }));

      setTasks(enriched);
      setProjects(p || []);
      setMembers(m || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form) {
    setSaving(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to || null,
        project_id: form.project_id || null,
      });
      if (error) throw error;
      toast("Task created!", "success");
      setShowCreate(false);
      fetchAll();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    setSaving(true);
    try {
      const update = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        project_id: form.project_id || null,
      };
      if (isAdmin) update.assigned_to = form.assigned_to || null;
      const { error } = await supabase.from("tasks").update(update).eq("id", editTask.id);
      if (error) throw error;
      toast("Task updated!", "success");
      setEditTask(null);
      fetchAll();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
      if (error) throw error;
      toast("Task deleted", "info");
      setDeleteTask(null);
      fetchAll();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast("Status updated", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  let filtered = tasks;
  if (!isAdmin) filtered = filtered.filter(t => t.assigned_to === profile?.id);
  if (filterStatus !== "All") {
    if (filterStatus === "Overdue") {
      filtered = filtered.filter(t => isOverdue(t.due_date, t.status));
    } else {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
  }
  if (filterPriority !== "All") filtered = filtered.filter(t => t.priority === filterPriority);
  if (filterProject) filtered = filtered.filter(t => String(t.project_id) === String(filterProject));
  if (search) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const overdueCount = tasks.filter(t =>
    (!isAdmin ? t.assigned_to === profile?.id : true) && isOverdue(t.due_date, t.status)
  ).length;

  const hasFilters = filterStatus !== "All" || filterPriority !== "All" || filterProject || search;

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "var(--text-primary)" }}>
              Tasks
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {filtered.length} task{filtered.length !== 1 ? "s" : ""}{overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ flex: "1 1 200px", maxWidth: 280 }}
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Overdue">Overdue</option>
          </select>
          <select className="input" style={{ width: 130 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="input" style={{ width: 180 }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStatus("All"); setFilterPriority("All"); setFilterProject(""); setSearch(""); }}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state" style={{ padding: 60 }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--border-hover)" strokeWidth={1.2} style={{ margin: "0 auto 16px", display: "block" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>
              {hasFilters ? "No matching tasks" : "No tasks yet"}
            </p>
            {isAdmin && !hasFilters && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={setEditTask}
                onDelete={setDeleteTask}
                onStatusChange={handleStatusChange}
                isAdmin={isAdmin}
                currentUserId={profile?.id}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)} size="lg">
          <TaskForm
            projects={projects}
            members={members}
            onSubmit={handleCreate}
            onClose={() => setShowCreate(false)}
            loading={saving}
            isAdmin={isAdmin}
            initial={{ title: "", description: "", status: "To Do", priority: "Medium", due_date: "", assigned_to: "", project_id: defaultProject }}
          />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)} size="lg">
          <TaskForm
            initial={{
              title: editTask.title,
              description: editTask.description || "",
              status: editTask.status,
              priority: editTask.priority || "Medium",
              due_date: editTask.due_date || "",
              assigned_to: editTask.assigned_to || "",
              project_id: editTask.project_id ? String(editTask.project_id) : "",
            }}
            projects={projects}
            members={members}
            onSubmit={handleEdit}
            onClose={() => setEditTask(null)}
            loading={saving}
            isAdmin={isAdmin}
          />
        </Modal>
      )}

      {deleteTask && (
        <ConfirmDelete
          title={deleteTask.title}
          onConfirm={handleDelete}
          onClose={() => setDeleteTask(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
