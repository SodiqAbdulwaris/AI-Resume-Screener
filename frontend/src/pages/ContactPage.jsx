import { useState } from "react";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import Alert from "../components/ui/Alert";
import Btn from "../components/ui/Btn";
import FormField from "../components/ui/FormField";
import Spinner from "../components/ui/Spinner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${COLORS.border2}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: COLORS.text,
  fontSize: 14,
  fontFamily: "'Geist', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const EMPTY_FORM = { name: "", email: "", message: "" };

export default function ContactPage({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Message sent successfully.");
        setForm(EMPTY_FORM);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        padding: "1rem",
      }}
    >
      <div
        style={{
          ...s.card,
          width: "100%",
          maxWidth: 520,
          border: `1px solid ${COLORS.border2}`,
          position: "relative",
          animation: "fade-up 0.22s ease",
        }}
        className="fade-up"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: COLORS.text,
                margin: 0,
              }}
            >
              Contact Us
            </h2>
            <p style={{ color: COLORS.text2, fontSize: 13, marginTop: "0.35rem", marginBottom: 0 }}>
              Send a message and we'll get back to you.
            </p>
          </div>
          <button
            id="contact-close-btn"
            onClick={onClose}
            aria-label="Close contact form"
            style={{
              background: "transparent",
              border: "none",
              color: COLORS.text3,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
              fontSize: 20,
              marginLeft: 12,
            }}
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0 0.75rem",
            }}
          >
            <FormField label="Name">
              <input
                id="contact-name"
                style={inputStyle}
                value={form.name}
                onChange={update("name")}
                placeholder="Your name"
                required
              />
            </FormField>
            <FormField label="Email">
              <input
                id="contact-email"
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                required
              />
            </FormField>
          </div>

          <FormField label="Message">
            <textarea
              id="contact-message"
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: 96 }}
              value={form.message}
              onChange={update("message")}
              placeholder="How can we help?"
              required
            />
          </FormField>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Btn
              id="contact-submit-btn"
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? <Spinner size={16} /> : "Send message"}
            </Btn>
            <Btn variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
