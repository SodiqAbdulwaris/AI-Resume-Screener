import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { sendContactFeedback } from "../../lib/api";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";
import FormField from "../ui/FormField";
import Spinner from "../ui/Spinner";

export default function ContactSupport() {
  const { user } = useOutletContext();
  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  async function submitFeedback(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await sendContactFeedback(form);
    setLoading(false);

    if (result.success) {
      setSuccess("Thanks. Your message has been sent.");
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } else {
      setError(result.message);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={s.card} className="fade-up">
        <h3 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Contact us
        </h3>
        <p style={{ color: COLORS.text2, fontSize: 13, marginBottom: "1.5rem" }}>
          Send feedback, report an issue, or ask for help with HireSignal.
        </p>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <form onSubmit={submitFeedback}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <FormField label="Name">
              <input value={form.name} onChange={update("name")} required />
            </FormField>
            <FormField label="Email">
              <input type="email" value={form.email} onChange={update("email")} required />
            </FormField>
          </div>
          <FormField label="Subject">
            <input placeholder="What should we know?" value={form.subject} onChange={update("subject")} />
          </FormField>
          <FormField label="Message">
            <textarea
              rows={6}
              placeholder="Share the details..."
              value={form.message}
              onChange={update("message")}
              required
              style={{ resize: "vertical" }}
            />
          </FormField>
          <Btn variant="primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? <Spinner size={16} /> : "Send feedback"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
