import { useState } from "react";
import { useOutletContext } from "react-router-dom";
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
    <div className="max-w-[600px]">
      <div className="fade-up rounded-[14px] border border-border bg-card p-6">
        <h3 className="mb-5 text-xl font-bold text-foreground">Post a new role</h3>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <div>
          <FormField label="Job title *">
            <input placeholder="e.g. Senior Backend Engineer" value={form.title} onChange={update("title")} required />
          </FormField>
          <FormField label="Description *">
            <textarea rows={4} placeholder="Describe the role, responsibilities, team, and expectations..." value={form.description} onChange={update("description")} required className="resize-y" />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <label className="my-3 flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <input type="checkbox" checked={customWeights} onChange={(e) => setCustomWeights(e.target.checked)} className="w-auto" />
            Advanced: customize matching weights for this job
          </label>
          {customWeights && (
            <div className="mb-4 rounded-[10px] bg-secondary p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Overrides the platform default for this job only. Must sum to 1.0.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className={`text-xs ${weightsSumOk ? "text-muted-foreground" : "text-red-500"}`}>
                Sum: {weightsSum.toFixed(2)} {!weightsSumOk && "— must equal 1.00"}
              </div>
            </div>
          )}

          <Btn variant="primary" fullWidth onClick={handleSubmit} disabled={loading || (customWeights && !weightsSumOk)} className="mt-1.5">
            {loading ? <Spinner size={16} /> : "Post job"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
