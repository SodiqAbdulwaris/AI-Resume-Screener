import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { sendContactFeedback } from "../lib/api";
import Alert from "../components/ui/Alert";
import Btn from "../components/ui/Btn";
import FormField from "../components/ui/FormField";
import Spinner from "../components/ui/Spinner";

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

    const r = await sendContactFeedback(form);
    setLoading(false);
    if (r.success) {
      setSuccess("Message sent successfully.");
      setForm(EMPTY_FORM);
    } else {
      setError(r.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="fade-up relative w-full max-w-[520px] rounded-[14px] border border-border bg-card p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Contact Us</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">Send a message and we'll get back to you.</p>
          </div>
          <button
            id="contact-close-btn"
            onClick={onClose}
            aria-label="Close contact form"
            className="ml-3 flex bg-transparent p-1 leading-none text-muted-foreground"
          >
            <Cross2Icon width={18} height={18} />
          </button>
        </div>

        {/* Alerts */}
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-3">
            <FormField label="Name">
              <input id="contact-name" value={form.name} onChange={update("name")} placeholder="Your name" required />
            </FormField>
            <FormField label="Email">
              <input id="contact-email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required />
            </FormField>
          </div>

          <FormField label="Message">
            <textarea
              id="contact-message"
              rows={4}
              className="min-h-24 resize-y"
              value={form.message}
              onChange={update("message")}
              placeholder="How can we help?"
              required
            />
          </FormField>

          <div className="mt-2 flex gap-3">
            <Btn id="contact-submit-btn" type="submit" variant="primary" disabled={loading}>
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
