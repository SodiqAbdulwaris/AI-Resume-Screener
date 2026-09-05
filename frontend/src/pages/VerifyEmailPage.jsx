import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail, resendVerification } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
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
    <AuthLayout title="Email Verification">
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Spinner size={32} />
          <p className="text-sm text-muted-foreground">Verifying your email address...</p>
        </div>
      ) : (
        <div>
          <Alert message={error} variant="error" />
          <Alert message={success} variant="success" />

          {success && (
            <div className="mt-4 text-center">
              <Btn variant="primary" onClick={() => navigate("/")}>Go to Sign In</Btn>
            </div>
          )}

          {error && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="mb-3 text-sm font-medium text-foreground">Resend Verification Email</h3>
              <Alert message={resendError} variant="error" />
              <Alert message={resendMsg} variant="success" />
              <form onSubmit={handleResend}>
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
    </AuthLayout>
  );
}
