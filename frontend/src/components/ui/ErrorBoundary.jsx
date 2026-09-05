import React from "react";
import { COLORS } from "../../constants/colors";
import Btn from "./Btn";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.bg,
            color: COLORS.text,
            padding: "2rem",
            fontFamily: "'Geist Variable', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 540,
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border2}`,
              borderRadius: 16,
              padding: "2.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
                color: COLORS.danger,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                marginBottom: "0.5rem",
                letterSpacing: "-0.01em",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: COLORS.text2,
                fontSize: 14,
                lineHeight: "1.5",
                marginBottom: "1.5rem",
              }}
            >
              An unexpected error occurred in the application. Please try reloading the page. If the issue persists, clearing your local session might help.
            </p>

            {this.state.error && (
              <div
                style={{
                  textAlign: "left",
                  background: "rgba(0, 0, 0, 0.25)",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "1rem",
                  marginBottom: "2rem",
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    color: COLORS.text3,
                    fontWeight: 600,
                    marginBottom: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  Error Message
                </div>
                <code
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#f87171",
                    wordBreak: "break-all",
                  }}
                >
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Btn onClick={this.handleReload} variant="primary">
                Reload Page
              </Btn>
              <Btn onClick={this.handleClearAndReload} variant="secondary">
                Clear Session & Restart
              </Btn>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
