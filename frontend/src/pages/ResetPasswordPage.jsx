import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../lib/api";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid link. Missing password reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const r = await resetPassword(token, form.password);
    setLoading(false);
    if (r.success) {
      setSuccess("Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } else {
      setError(r.message || "Failed to reset password.");
    }
  };

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
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: COLORS.text }}>
            Reset Password
          </h1>
          <p style={{ color: COLORS.text3, fontSize: 14, marginTop: "0.35rem" }}>Enter your new secure password</p>
        </div>

        <div style={{ ...s.card, border: `1px solid ${COLORS.border2}` }}>
          <Alert message={error} variant="error" />
          <Alert message={success} variant="success" />

          {!token ? (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Btn variant="primary" onClick={() => navigate("/")}>Go to Sign In</Btn>
            </div>
          ) : !success ? (
            <form onSubmit={handleSubmit}>
              <FormField label="New Password" hint="(min 8 characters)">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Confirm Password">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </FormField>
              <Btn variant="primary" fullWidth type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <Spinner size={16} /> : "Reset Password"}
              </Btn>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
