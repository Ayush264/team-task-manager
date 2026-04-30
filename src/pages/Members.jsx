import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";
import { formatDate } from "../utils/helpers";

export default function Members() {
  const { profile } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, tasks:tasks!tasks_assigned_to_fkey(id, status)")
        .order("name");
      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", memberId);
      if (error) throw error;
      toast(`Role updated to ${newRole}`, "success");
      fetchMembers();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "var(--text-primary)" }}>
              Team Members
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
              {members.length} member{members.length !== 1 ? "s" : ""} in your team
            </p>
          </div>
          <input
            className="input"
            style={{ width: 240 }}
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner size={36} />
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Header row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px 100px 120px 120px",
              gap: 12,
              padding: "10px 20px",
              background: "var(--bg-hover)",
              borderBottom: "1px solid var(--border)",
            }}>
              {["Member", "Email", "Role", "Tasks", "Joined"].map(h => (
                <span key={h} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>No members found</p>
              </div>
            ) : (
              filtered.map(m => {
                const totalTasks = m.tasks?.length || 0;
                const doneTasks = m.tasks?.filter(t => t.status === "Completed").length || 0;
                const isSelf = m.id === profile?.id;

                return (
                  <div
                    key={m.id}
                    className="table-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 200px 100px 120px 120px",
                      gap: 12,
                      padding: "14px 20px",
                      alignItems: "center",
                    }}
                  >
                    {/* Member */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: m.role === "admin" ? "var(--accent-dim)" : "var(--bg-hover)",
                        border: `1px solid ${m.role === "admin" ? "var(--accent)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: m.role === "admin" ? "var(--accent)" : "var(--text-secondary)",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {m.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                          {m.name}
                          {isSelf && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: 6 }}>(you)</span>}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <span style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </span>

                    {/* Role */}
                    <div>
                      {isSelf ? (
                        <span className={`badge badge-${m.role}`}>{m.role}</span>
                      ) : (
                        <select
                          className="input"
                          style={{ padding: "4px 28px 4px 8px", fontSize: 12, height: "auto", width: "auto" }}
                          value={m.role}
                          onChange={e => handleRoleChange(m.id, e.target.value)}
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </div>

                    {/* Tasks */}
                    <div>
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {doneTasks}/{totalTasks}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}> done</span>
                    </div>

                    {/* Joined */}
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
