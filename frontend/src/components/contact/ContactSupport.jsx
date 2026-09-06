import { useState } from "react";
import { useOutletContext } from "react-router-dom";
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
    <div className="max-w-[620px]">
      <div className="fade-up rounded-[14px] border border-border bg-card p-6">
        <h3 className="mb-1.5 text-xl font-bold text-foreground">Contact us</h3>
        <p className="mb-6 text-[13px] text-muted-foreground">
          Send feedback, report an issue, or ask for help with HireSignal.
        </p>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <form onSubmit={submitFeedback}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
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
              className="resize-y"
            />
          </FormField>
          <Btn variant="primary" type="submit" disabled={loading} className="mt-1.5">
            {loading ? <Spinner size={16} /> : "Send feedback"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
