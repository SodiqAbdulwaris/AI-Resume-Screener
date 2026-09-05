import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { forgotPassword } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const r = await forgotPassword(email);
    setLoading(false);
    if (r.success) {
      setMessage("If that email is registered, you'll receive a reset link shortly.");
    } else {
      setError(r.message || "Something went wrong.");
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to reset password">
      <Alert message={error} variant="error" />
      <Alert message={message} variant="success" />

      {!message && (
        <form onSubmit={handleSubmit}>
          <FormField label="Email address">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <Btn variant="primary" fullWidth type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <Spinner size={16} /> : "Send Reset Link"}
          </Btn>
        </form>
      )}

      <div className="mt-6 text-center">
        <Btn variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeftIcon /> Back to Sign In
        </Btn>
      </div>
    </AuthLayout>
  );
}
