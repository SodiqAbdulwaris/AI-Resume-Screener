import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { createJob } from "../../lib/api";
import Alert from "../ui/Alert";
import FormField from "../ui/FormField";
import Btn from "../ui/Btn";
import Spinner from "../ui/Spinner";

export default function PostJobView() {
  const { token, onPosted } = useOutletContext();
  const [form, setForm] = useState({
    title: "", description: "", requiredSkills: "", preferredSkills: "",
    requiredEducationLevel: "any", requiredExperienceYears: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) { setError("Title and description are required."); return; }
    setLoading(true); setError(null); setSuccess(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSkills: form.preferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      requiredEducationLevel: form.requiredEducationLevel,
      requiredExperienceYears: parseInt(form.requiredExperienceYears || "0"),
    };
    const r = await createJob(payload, token);
    setLoading(false);
    if (r.success) {
      setSuccess("Job posted successfully!");
      setForm({ title: "", description: "", requiredSkills: "", preferredSkills: "", requiredEducationLevel: "any", requiredExperienceYears: "" });
      onPosted();
    } else {
      setError(r.message);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={s.card} className="fade-up">
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", fontWeight: 400, marginBottom: "1.25rem" }}>Post a new role</h3>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <div>
          <FormField label="Job title *">
            <input placeholder="e.g. Senior Backend Engineer" value={form.title} onChange={update("title")} required />
          </FormField>
          <FormField label="Description *">
            <textarea rows={4} placeholder="Describe the role, responsibilities, team, and expectations..." value={form.description} onChange={update("description")} required style={{ resize: "vertical" }} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <FormField label="Min. education">
              <select value={form.requiredEducationLevel} onChange={update("requiredEducationLevel")}>
                <option value="any">Any</option>
                <option value="olevel">O-Level / High School</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </FormField>
            <FormField label="Min. years experience">
              <input type="number" min="0" placeholder="0" value={form.requiredExperienceYears} onChange={update("requiredExperienceYears")} />
            </FormField>
          </div>
          <FormField label="Required skills" hint="comma separated">
            <input placeholder="node.js, mongodb, rest api, express" value={form.requiredSkills} onChange={update("requiredSkills")} />
          </FormField>
          <FormField label="Preferred skills" hint="comma separated">
            <input placeholder="docker, aws, typescript" value={form.preferredSkills} onChange={update("preferredSkills")} />
          </FormField>
          <Btn variant="primary" fullWidth onClick={handleSubmit} disabled={loading} style={{ marginTop: 6 }}>
            {loading ? <Spinner size={16} /> : "Post job"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
