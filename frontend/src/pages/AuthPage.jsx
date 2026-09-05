import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { useAuth } from "../context/AuthContext";
import { authLogin, authRegister, resendVerification } from "../lib/api";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";

export default function AuthPage() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Verification resend states
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified. You can now log in.");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleLogin() {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true); setError(null); setShowResend(false); setResendSuccess(null);
    const r = await authLogin({ email: form.email, password: form.password });
    setLoading(false);
    if (r.success) {
      login(r.data.token, r.data.user);
    } else {
      setError(r.message);
      if (r.data?.needsVerification) {
        setShowResend(true);
      }
    }
  }

  async function handleRegister() {
    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true); setError(null); setSuccessMsg(null);
    const r = await authRegister({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role
    });
    setLoading(false);
    if (r.success) {
      if (r.data?.needsVerification) {
        setTab("login");
        setSuccessMsg(r.message);
        setShowResend(true);
      } else {
        login(r.data.token, r.data.user);
      }
    } else {
      setError(r.message);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true); setError(null); setResendSuccess(null);
    const r = await resendVerification(form.email);
    setResendLoading(false);
    if (r.success) {
      setResendSuccess("Verification email resent. Please check your inbox.");
      setShowResend(false);
    } else {
      setError(r.message || "Failed to resend verification email.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: COLORS.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ width: "100%", maxWidth: 400, position: "relative" }} className="fade-up">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: COLORS.accent,
              borderRadius: 14,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h11M3 16h7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2.2rem", fontWeight: 400, color: COLORS.text }}>
            HireSignal
          </h1>
          <p style={{ color: COLORS.text3, fontSize: 14, marginTop: "0.35rem" }}>AI-powered resume screening</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: COLORS.bg2, borderRadius: 10, padding: 4, marginBottom: "1.25rem" }}>
          {[{ key: "login", label: "Sign in" }, { key: "register", label: "Create account" }].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(null); setSuccessMsg(null); setShowResend(false); setResendSuccess(null); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 7,
                background: tab === t.key ? COLORS.card : "transparent",
                color: tab === t.key ? COLORS.text : COLORS.text2,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                fontFamily: "'Geist', sans-serif",
                transition: "all 0.18s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ ...s.card, border: `1px solid ${COLORS.border2}` }}>
          <Alert message={error} variant="error" />
          <Alert message={successMsg} variant="success" />
          {resendSuccess && <Alert message={resendSuccess} variant="success" />}

          {tab === "login" ? (
            <div>
              <FormField label="Email">
                <input type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
              </FormField>
              <FormField label="Password">
                <input type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required style={{ marginBottom: "0.5rem" }} />
              </FormField>
              <div style={{ textAlign: "right", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#a5b4fc",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "'Geist', sans-serif",
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <Btn variant="primary" fullWidth onClick={handleLogin} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <Spinner size={16} /> : "Sign in"}
              </Btn>

              {showResend && (
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: COLORS.accent,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'Geist', sans-serif",
                      textDecoration: "underline",
                    }}
                  >
                    {resendLoading ? "Resending..." : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <FormField label="Full name">
                <input placeholder="Jane Smith" value={form.fullName} onChange={update("fullName")} required />
              </FormField>
              <FormField label="Email">
                <input type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
              </FormField>
              <FormField label="Password" hint="(8+ characters)">
                <input type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required />
              </FormField>
              <FormField label="I am a">
                <select value={form.role} onChange={update("role")}>
                  <option value="candidate">Candidate looking for work</option>
                  <option value="recruiter">Recruiter hiring talent</option>
                </select>
              </FormField>
              <Btn variant="primary" fullWidth onClick={handleRegister} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <Spinner size={16} /> : "Create account"}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
