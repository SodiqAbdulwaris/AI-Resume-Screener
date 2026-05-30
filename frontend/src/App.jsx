import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Spinner from "./components/ui/Spinner";
import { COLORS } from "./constants/colors";

function AppContent() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.bg,
        }}
      >
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
            animation: "pulse 1.5s infinite ease-in-out",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6h16M3 11h11M3 16h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <Spinner size={24} color={COLORS.accent} />
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPage />;
  }

  return user.role === "candidate" ? <CandidateDashboard /> : <RecruiterDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
