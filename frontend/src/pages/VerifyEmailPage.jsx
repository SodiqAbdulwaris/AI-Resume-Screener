import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail, resendVerification } from "../lib/api";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);
  const [resendError, setResendError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid link. Missing verification token.");
      setLoading(false);
      return;
    }

    async function doVerify() {
      const r = await verifyEmail(token);
      setLoading(false);
      if (r.success) {
        setSuccess("Email verified successfully! Redirecting to sign in...");
        setTimeout(() => {
          navigate("/?verified=true");
        }, 3000);
      } else {
        setError(r.message || "Email verification failed.");
      }
    }

    doVerify();
  }, [token, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setResendError("Please enter your email.");
      return;
    }
    setResending(true);
    setResendError(null);
    setResendMsg(null);
    const r = await resendVerification(email);
    setResending(false);
    if (r.success) {
      setResendMsg("If that email is registered and unverified, a verification link has been sent.");
    } else {
      setResendError(r.message || "Failed to resend verification email.");
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
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2.2rem", fontWeight: 400, color: COLORS.text }}>
            Email Verification
          </h1>
        </div>

        <div style={{ ...s.card, border: `1px solid ${COLORS.border2}` }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 0" }}>
              <Spinner size={32} />
              <p style={{ color: COLORS.text2, fontSize: 14 }}>Verifying your email address...</p>
            </div>
          ) : (
            <div>
              <Alert message={error} variant="error" />
              <Alert message={success} variant="success" />

              {success && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <Btn variant="primary" onClick={() => navigate("/")}>Go to Sign In</Btn>
                </div>
              )}

              {error && (
                <div style={{ marginTop: "1.5rem", borderTop: `1px solid ${COLORS.border}`, paddingTop: "1.5rem" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.75rem", color: COLORS.text }}>
                    Resend Verification Email
                  </h3>
                  <Alert message={resendError} variant="error" />
                  <Alert message={resendMsg} variant="success" />
                  <form onSubmit={handleResend}>
                    <div style={{ marginBottom: "1rem" }}>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: COLORS.bg,
                          border: `1px solid ${COLORS.border}`,
                          color: COLORS.text,
                          fontSize: 14,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <Btn variant="secondary" fullWidth type="submit" disabled={resending}>
                      {resending ? <Spinner size={16} /> : "Resend Link"}
                    </Btn>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
