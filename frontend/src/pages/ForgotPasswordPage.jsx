import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { forgotPassword } from "../lib/api";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
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
            Forgot Password
          </h1>
          <p style={{ color: COLORS.text3, fontSize: 14, marginTop: "0.35rem" }}>Enter your email to reset password</p>
        </div>

        <div style={{ ...s.card, border: `1px solid ${COLORS.border2}` }}>
          <Alert message={error} variant="error" />
          <Alert message={message} variant="success" />

          {!message ? (
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
          ) : null}

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeftIcon /> Back to Sign In
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
