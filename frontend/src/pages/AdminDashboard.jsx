import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { fmtDate } from "../lib/utils";
import {
  getAdminUsers,
  deactivateAdminUser,
  getAdminJobs,
  getAdminStats,
  getAdminSettings,
  updateAdminSettings,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import Btn from "../components/ui/Btn";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import SkeletonBlock from "../components/ui/SkeletonBlock";

const TABLE_CELL = { padding: "10px 12px", fontSize: 13, borderBottom: `1px solid ${COLORS.border2}` };

function StatsGrid({ stats }) {
  const cards = [
    { label: "Candidates", value: stats.totalCandidates },
    { label: "Recruiters", value: stats.totalRecruiters },
    { label: "Jobs (open)", value: `${stats.totalJobs} (${stats.openJobs})` },
    { label: "Jobs matched", value: stats.jobsMatched },
    { label: "Applications", value: stats.totalApplications },
    { label: "Match results", value: stats.totalMatches },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
      {cards.map((c) => (
        <div key={c.label} style={s.card}>
          <div style={{ fontSize: 12, color: COLORS.text2, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontFamily: "'Geist Variable', sans-serif", fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (cursor = null) => {
    setLoading(!cursor);
    const r = await getAdminUsers(token, cursor);
    if (r.success) {
      setUsers((prev) => (cursor ? [...prev, ...r.data.items] : r.data.items));
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    } else setError(r.message);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (user) => {
    setError(null);
    const r = await deactivateAdminUser(user._id, !user.isDeleted, token);
    if (r.success) setUsers((prev) => prev.map((u) => (u._id === user._id ? r.data : u)));
    else setError(r.message);
  };

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div style={s.card}>
      <Alert message={error} variant="error" />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Email", "Role", "Status", "Joined", ""].map((h) => (
                <th key={h} style={{ ...TABLE_CELL, textAlign: "left", color: COLORS.text2, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={TABLE_CELL}>{u.fullName}</td>
                <td style={TABLE_CELL}>{u.email}</td>
                <td style={TABLE_CELL}><Badge variant={u.role === "admin" ? "blue" : u.role === "recruiter" ? "teal" : "gray"}>{u.role}</Badge></td>
                <td style={TABLE_CELL}>{u.isDeleted ? <Badge variant="red">Deactivated</Badge> : <Badge variant="green">Active</Badge>}</td>
                <td style={TABLE_CELL}>{fmtDate(u.createdAt)}</td>
                <td style={TABLE_CELL}>
                  {u.role !== "admin" && (
                    <Btn variant={u.isDeleted ? "secondary" : "danger"} size="sm" onClick={() => toggle(u)}>
                      {u.isDeleted ? "Reactivate" : "Deactivate"}
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Btn variant="secondary" size="sm" onClick={() => load(nextCursor)}>Load more</Btn>
        </div>
      )}
    </div>
  );
}

function JobsTab({ token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (cursor = null) => {
    setLoading(!cursor);
    const r = await getAdminJobs(token, cursor);
    if (r.success) {
      setJobs((prev) => (cursor ? [...prev, ...r.data.items] : r.data.items));
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div style={s.card}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Title", "Recruiter", "Status", "Last matched", "Posted"].map((h) => (
                <th key={h} style={{ ...TABLE_CELL, textAlign: "left", color: COLORS.text2, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j._id}>
                <td style={TABLE_CELL}>{j.title}</td>
                <td style={TABLE_CELL}>{j.createdBy?.fullName || "—"}</td>
                <td style={TABLE_CELL}>{j.isOpen ? <Badge variant="green">Open</Badge> : <Badge variant="gray">Closed</Badge>}</td>
                <td style={TABLE_CELL}>{j.lastMatchedAt ? fmtDate(j.lastMatchedAt) : "Never run"}</td>
                <td style={TABLE_CELL}>{fmtDate(j.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Btn variant="secondary" size="sm" onClick={() => load(nextCursor)}>Load more</Btn>
        </div>
      )}
    </div>
  );
}

const WEIGHT_FIELDS = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "semantic", label: "Semantic similarity" },
  { key: "education", label: "Education" },
];

function SettingsTab({ token }) {
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await getAdminSettings(token);
      if (r.success) setWeights(r.data.defaultWeights);
      else setError(r.message);
      setLoading(false);
    })();
  }, [token]);

  const sum = weights ? WEIGHT_FIELDS.reduce((acc, f) => acc + Number(weights[f.key] || 0), 0) : 0;
  const sumOk = Math.abs(sum - 1) < 0.001;

  const save = async () => {
    setSaving(true); setError(null); setSuccess(null);
    const r = await updateAdminSettings(weights, token);
    setSaving(false);
    if (r.success) setSuccess("Default weights updated.");
    else setError(r.message);
  };

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div style={{ ...s.card, maxWidth: 480 }}>
      <div style={s.sectionLabel}>Default matching weights</div>
      <p style={{ fontSize: 12, color: COLORS.text2, marginBottom: "1rem" }}>
        Used for any job that doesn't set its own weight override. Must sum to 1.0.
      </p>
      <Alert message={error} variant="error" />
      <Alert message={success} variant="success" />
      {WEIGHT_FIELDS.map((f) => (
        <div key={f.key} style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: 12, color: COLORS.text2, display: "block", marginBottom: 4 }}>{f.label}</label>
          <input
            type="number" step="0.05" min="0" max="1"
            value={weights[f.key]}
            onChange={(e) => setWeights((w) => ({ ...w, [f.key]: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      ))}
      <div style={{ fontSize: 12, color: sumOk ? COLORS.text2 : "#f87171", marginBottom: "1rem" }}>
        Sum: {sum.toFixed(2)} {!sumOk && "— must equal 1.00"}
      </div>
      <Btn variant="primary" onClick={save} disabled={saving || !sumOk}>
        {saving ? "Saving…" : "Save defaults"}
      </Btn>
    </div>
  );
}

export default function AdminDashboard({ onContactClick }) {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await getAdminStats(token);
      if (r.success) setStats(r.data);
    })();
  }, [token]);

  const tabDefs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "jobs", label: "Jobs" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <PageHeader title="Admin Dashboard" subtitle="Platform-wide users, jobs, and matching defaults." />
        <Tabs tabs={tabDefs} active={tab} onChange={setTab} />
        {tab === "overview" && (stats ? <StatsGrid stats={stats} /> : <SkeletonBlock height={100} />)}
        {tab === "users" && <UsersTab token={token} />}
        {tab === "jobs" && <JobsTab token={token} />}
        {tab === "settings" && <SettingsTab token={token} />}
      </div>
    </div>
  );
}
