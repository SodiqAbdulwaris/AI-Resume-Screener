import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
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
    <AuthLayout title="Reset Password" subtitle="Enter your new secure password">
      <Alert message={error} variant="error" />
      <Alert message={success} variant="success" />

      {!token ? (
        <div className="mt-4 text-center">
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
    </AuthLayout>
  );
}
