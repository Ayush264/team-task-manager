import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmDelete from "../components/ConfirmDelete";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";
import { formatDate, truncate } from "../utils/helpers";

function ProjectForm({ initial, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(initial || { title: "", description: "" });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
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
      <div style={{ marginBottom: 16 }}>
        <label className="label">Project Title *</label>
        <input
          className={`input${errors.title ? " input-error" : ""}`}
          placeholder="e.g. Website Redesign"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
        {errors.title && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.title}</p>}
      </div>
      <div style={{ marginBottom: 24 }}>
        <label className="label">Description</label>
        <textarea
          className="input"
          placeholder="What is this project about?"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : initial ? "Save Changes" : "Create Project"}
        </button>
      </div>
    </form>
  );
}

function ManageMembersModal({ project, onClose }) {
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: users }, { data: pm }] = await Promise.all([
      supabase.from("users").select("id, name, email, role").order("name"),
      supabase.from("project_members").select("user_id").eq("project_id", project.id),
    ]);
    setAllUsers(users || []);
    setMembers((pm || []).map(m => m.user_id));
    setLoading(false);
  }

  async function toggle(userId, isMember) {
    setSaving(userId);
    try {
      if (isMember) {
        const { error } = await supabase.from("project_members").delete()
          .eq("project_id", project.id).eq("user_id", userId);
        if (error) throw error;
        setMembers(prev => prev.filter(id => id !== userId));
        toast("Member removed", "info");
      } else {
        const { error } = await supabase.from("project_members").insert({
          project_id: project.id, user_id: userId,
        });
        if (error) throw error;
        setMembers(prev => [...prev, userId]);
        toast("Member added", "success");
      }
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal title={`Manage Members — ${project.title}`} onClose={onClose} size="lg">
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner size={28} /></div>
      ) : (
        <div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Toggle members to add or remove them from this project.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
            {allUsers.map(u => {
              const isMember = members.includes(u.id);
              return (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10,
                  background: isMember ? "var(--accent-dim)" : "var(--bg-hover)",
                  border: `1px solid ${isMember ? "var(--accent)" : "var(--border)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: "var(--bg-card)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, color: "var(--accent)",
                    }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{u.email} · {u.role}</p>
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${isMember ? "btn-secondary" : "btn-primary"}`}
                    onClick={() => toggle(u.id, isMember)}
                    disabled={saving === u.id}
                    style={{ minWidth: 80 }}
                  >
                    {saving === u.id ? "..." : isMember ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Projects() {
  const { profile, isAdmin } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [manageMembers, setManageMembers] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      let query = supabase
        .from("projects")
        .select("*, tasks(id, status), creator:users!projects_created_by_fkey(name), project_members(user_id)")
        .order("created_at", { ascending: false });

      // Members see only their projects
      if (!isAdmin) {
        const { data: myMemberships } = await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", profile?.id);
        const myProjectIds = (myMemberships || []).map(m => m.project_id);
        if (myProjectIds.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }
        query = query.in("id", myProjectIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form) {
    setSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        created_by: profile.id,
      });
      if (error) throw error;
      toast("Project created!", "success");
      setShowCreate(false);
      fetchProjects();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ title: form.title.trim(), description: form.description.trim() })
        .eq("id", editProject.id);
      if (error) throw error;
      toast("Project updated!", "success");
      setEditProject(null);
      fetchProjects();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await supabase.from("tasks").delete().eq("project_id", deleteProject.id);
      await supabase.from("project_members").delete().eq("project_id", deleteProject.id);
      const { error } = await supabase.from("projects").delete().eq("id", deleteProject.id);
      if (error) throw error;
      toast("Project deleted", "info");
      setDeleteProject(null);
      fetchProjects();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "var(--text-primary)" }}>
              Projects
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ width: 220 }}
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card" style={{ padding: 60 }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--border-hover)" strokeWidth={1.2} style={{ margin: "0 auto 16px", display: "block" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>
              {search ? "No matching projects" : "No projects yet"}
            </p>
            {isAdmin && !search && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(p => {
              const total = p.tasks?.length || 0;
              const done = p.tasks?.filter(t => t.status === "Done").length || 0;
              const pct = total > 0 ? Math.round(done / total * 100) : 0;
              const memberCount = p.project_members?.length || 0;

              return (
                <div key={p.id} className="card card-glow" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                        <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
                          {p.title}
                        </h3>
                      </Link>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {truncate(p.description, 90) || "No description"}
                      </p>
                    </div>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setManageMembers(p)} title="Manage Members">
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditProject(p)} title="Edit">
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteProject(p)} title="Delete" style={{ color: "var(--danger)" }}>
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{done}/{total} tasks done</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(p.created_at)}</span>
                  </div>

                  <Link to={`/projects/${p.id}`} style={{ textDecoration: "none", color: "var(--accent)", fontSize: 13, fontWeight: 500 }}>
                    View tasks →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)}>
          <ProjectForm onSubmit={handleCreate} onClose={() => setShowCreate(false)} loading={saving} />
        </Modal>
      )}

      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm initial={editProject} onSubmit={handleEdit} onClose={() => setEditProject(null)} loading={saving} />
        </Modal>
      )}

      {manageMembers && (
        <ManageMembersModal project={manageMembers} onClose={() => { setManageMembers(null); fetchProjects(); }} />
      )}

      {deleteProject && (
        <ConfirmDelete
          title={deleteProject.title}
          message={`Delete "${deleteProject.title}"? All tasks in this project will also be deleted.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteProject(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
