import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { createJob } from "../../lib/api";
import Alert from "../ui/Alert";
import FormField from "../ui/FormField";
import Btn from "../ui/Btn";
import Spinner from "../ui/Spinner";

const DEFAULT_WEIGHTS = { skills: 0.4, experience: 0.3, semantic: 0.2, education: 0.1 };
const WEIGHT_FIELDS = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "semantic", label: "Semantic similarity" },
  { key: "education", label: "Education" },
];

export default function PostJobView() {
  const { token, onPosted } = useOutletContext();
  const [form, setForm] = useState({
    title: "", description: "", requiredSkills: "", preferredSkills: "",
    requiredEducationLevel: "any", requiredExperienceYears: "",
  });
  const [customWeights, setCustomWeights] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const weightsSum = WEIGHT_FIELDS.reduce((acc, f) => acc + Number(weights[f.key] || 0), 0);
  const weightsSumOk = Math.abs(weightsSum - 1) < 0.001;

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) { setError("Title and description are required."); return; }
    if (customWeights && !weightsSumOk) { setError("Custom matching weights must sum to 1.0."); return; }
    setLoading(true); setError(null); setSuccess(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSkills: form.preferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      requiredEducationLevel: form.requiredEducationLevel,
      requiredExperienceYears: parseInt(form.requiredExperienceYears || "0"),
      ...(customWeights && { weights }),
    };
    const r = await createJob(payload, token);
    setLoading(false);
    if (r.success) {
      setSuccess("Job posted successfully!");
      setForm({ title: "", description: "", requiredSkills: "", preferredSkills: "", requiredEducationLevel: "any", requiredExperienceYears: "" });
      setCustomWeights(false);
      setWeights(DEFAULT_WEIGHTS);
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

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.text2, margin: "0.5rem 0 1rem", cursor: "pointer" }}>
            <input type="checkbox" checked={customWeights} onChange={(e) => setCustomWeights(e.target.checked)} style={{ width: "auto" }} />
            Advanced: customize matching weights for this job
          </label>
          {customWeights && (
            <div style={{ background: COLORS.bg3, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: 12, color: COLORS.text2, marginBottom: "0.75rem" }}>
                Overrides the platform default for this job only. Must sum to 1.0.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {WEIGHT_FIELDS.map((f) => (
                  <FormField key={f.key} label={f.label}>
                    <input
                      type="number" step="0.05" min="0" max="1"
                      value={weights[f.key]}
                      onChange={(e) => setWeights((w) => ({ ...w, [f.key]: parseFloat(e.target.value) || 0 }))}
                    />
                  </FormField>
                ))}
              </div>
              <div style={{ fontSize: 12, color: weightsSumOk ? COLORS.text2 : "#f87171" }}>
                Sum: {weightsSum.toFixed(2)} {!weightsSumOk && "— must equal 1.00"}
              </div>
            </div>
          )}

          <Btn variant="primary" fullWidth onClick={handleSubmit} disabled={loading || (customWeights && !weightsSumOk)} style={{ marginTop: 6 }}>
            {loading ? <Spinner size={16} /> : "Post job"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
