import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authLogin, authRegister, resendVerification } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";
import Tabs from "../components/ui/Tabs";

export default function AuthPage() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  function switchTab(key) {
    setTab(key);
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);
    setResendSuccess(null);
  }

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
    <AuthLayout title="HireSignal" subtitle="AI-powered resume screening">
      <Tabs
        tabs={[{ key: "login", label: "Sign in" }, { key: "register", label: "Create account" }]}
        active={tab}
        onChange={switchTab}
      />

      <Alert message={error} variant="error" />
      <Alert message={successMsg} variant="success" />
      {resendSuccess && <Alert message={resendSuccess} variant="success" />}

      {tab === "login" ? (
        <div>
          <FormField label="Email">
            <input type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
          </FormField>
          <FormField label="Password">
            <input type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required className="mb-2" />
          </FormField>
          <div className="mb-4 text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="bg-transparent text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Btn variant="primary" fullWidth onClick={handleLogin} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <Spinner size={16} /> : "Sign in"}
          </Btn>

          {showResend && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="bg-transparent text-sm font-medium text-primary underline"
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
    </AuthLayout>
  );
}
