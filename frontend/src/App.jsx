import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ContactPage from "./pages/ContactPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Spinner from "./components/ui/Spinner";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Candidate tab pages (routed children of CandidateDashboard layout)
import CandidateBrowse from "./components/candidate/CandidateBrowse";
import CandidateApplications from "./components/candidate/CandidateApplications";
import CandidateProfile from "./components/candidate/CandidateProfile";
import ResumeUpload from "./components/candidate/ResumeUpload";

// Recruiter tab pages (routed children of RecruiterDashboard layout)
import RecruiterJobs from "./components/recruiter/RecruiterJobs";
import PostJobView from "./components/recruiter/PostJobView";
import MatchView from "./components/recruiter/MatchView";

// Shared contact tab (used inside both dashboard layouts)
import ContactSupport from "./components/contact/ContactSupport";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary" style={{ animation: "pulse 1.5s infinite ease-in-out" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 6h16M3 11h11M3 16h7" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <Spinner size={24} color="var(--primary)" />
    </div>
  );
}

function AppRoutes() {
  const { token, user, loading } = useAuth();
  const [showContact, setShowContact] = useState(false);

  if (loading) return <LoadingScreen />;

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!token || !user) {
    return (
      <>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<AuthPage />} />
        </Routes>
        {showContact && <ContactPage onClose={() => setShowContact(false)} />}
      </>
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (user.role === "admin") {
    return (
      <Routes>
        <Route path="*" element={<AdminDashboard onContactClick={() => setShowContact(true)} />} />
      </Routes>
    );
  }

  // ── Candidate ──────────────────────────────────────────────────────────────
  if (user.role === "candidate") {
    return (
      <>
        <Routes>
          {/* Layout wrapper supplies shared data via Outlet context */}
          <Route
            path="/"
            element={<CandidateDashboard onContactClick={() => setShowContact(true)} />}
          >
            <Route index element={<Navigate to="/jobs" replace />} />
            <Route path="jobs" element={<CandidateBrowse />} />
            <Route path="applications" element={<CandidateApplications />} />
            <Route path="profile" element={<CandidateProfile />} />
            <Route path="resume" element={<ResumeUpload />} />
            <Route path="contact" element={<ContactSupport />} />
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Route>
        </Routes>
        {showContact && <ContactPage onClose={() => setShowContact(false)} />}
      </>
    );
  }

  // ── Recruiter ──────────────────────────────────────────────────────────────
  return (
    <>
      <Routes>
        {/* Standalone match-view page — has its own Nav, rendered outside the layout */}
        <Route
          path="/recruiter/jobs/:jobId/matches"
          element={<MatchView onContactClick={() => setShowContact(true)} />}
        />

        {/* Layout wrapper for all other recruiter tabs */}
        <Route
          path="/recruiter"
          element={<RecruiterDashboard onContactClick={() => setShowContact(true)} />}
        >
          <Route index element={<Navigate to="/recruiter/jobs" replace />} />
          <Route path="jobs" element={<RecruiterJobs />} />
          <Route path="post" element={<PostJobView />} />
          <Route path="contact" element={<ContactSupport />} />
        </Route>

        {/* Catch-all → recruiter home */}
        <Route path="*" element={<Navigate to="/recruiter/jobs" replace />} />
      </Routes>
      {showContact && <ContactPage onClose={() => setShowContact(false)} />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
