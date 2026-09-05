import { useState, useRef } from "react";
import { CheckIcon, UploadIcon, FileTextIcon, Cross2Icon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { fmtDate } from "../../lib/utils";
import { uploadResume } from "../../lib/api";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

import { useOutletContext } from "react-router-dom";

function ParseStatusBadge({ status }) {
  const byStatus = {
    done: { variant: "green", label: "Parsed", icon: <CheckIcon /> },
    needs_review: { variant: "yellow", label: "Needs review" },
    failed: { variant: "red", label: "Parse failed" },
    processing: { variant: "blue", label: "Processing…" },
    pending: { variant: "gray", label: "Pending" },
  };
  const { variant, label, icon } = byStatus[status] || byStatus.pending;
  return <Badge variant={variant} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{icon}{label}</Badge>;
}

export default function ResumeUpload() {
  const { token, loadAll: onUploaded, resumeInfo } = useOutletContext();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFile(f) {
    setError(null); setSuccess(null); setWarning(null);
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) { setError("Only PDF and DOCX files are accepted."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File is larger than 5MB."); return; }
    setFile(f);
  }

  async function doUpload() {
    if (!file) return;
    setLoading(true); setError(null); setSuccess(null); setWarning(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadResume(fd, token);
    setLoading(false);
    if (r.success) {
      setFile(null);
      if (r.data?.parseStatus === "needs_review") setWarning(r.message);
      else setSuccess(r.message || "Resume uploaded and parsed successfully!");
      onUploaded();
    } else setError(r.message);
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={s.card} className="fade-up">
        <h3 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>Upload Resume</h3>
        <p style={{ color: COLORS.text2, fontSize: 13, marginBottom: "1.5rem" }}>
          PDF or DOCX only, max 5MB. Uploading replaces your current active resume automatically.
        </p>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <Alert message={warning} variant="warning" />
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          style={{
            border: `2px dashed ${dragging ? COLORS.accent : COLORS.border2}`,
            borderRadius: 12,
            padding: "2.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? COLORS.accentGlow : "transparent",
            transition: "all 0.2s",
            marginBottom: file ? "1rem" : 0,
          }}
        >
          <UploadIcon width={36} height={36} style={{ marginBottom: "0.75rem" }} />
          <div style={{ fontWeight: 500, marginBottom: "0.3rem" }}>Drop your resume here</div>
          <div style={{ fontSize: 13, color: COLORS.text2 }}>or click to browse</div>
          <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {file && (
          <div style={{ background: COLORS.bg3, padding: "0.75rem 1rem", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><FileTextIcon /> {file.name}</div>
              <div style={{ fontSize: 11, color: COLORS.text3 }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" size="sm" onClick={() => setFile(null)}><Cross2Icon /></Btn>
              <Btn variant="primary" size="sm" onClick={doUpload} disabled={loading}>
                {loading ? <Spinner size={14} /> : "Upload"}
              </Btn>
            </div>
          </div>
        )}
      </div>
      {resumeInfo && (
        <div style={{ ...s.card, marginTop: "1rem" }} className="fade-up-2">
          <div style={s.sectionLabel}>Current resume</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{resumeInfo.originalFileName}</div>
          <div style={{ fontSize: 12, color: COLORS.text2, marginBottom: "0.75rem" }}>
            {(resumeInfo.fileSize / 1024).toFixed(0)} KB · Uploaded {fmtDate(resumeInfo.createdAt)}
          </div>
          <ParseStatusBadge status={resumeInfo.parseStatus} />
          {resumeInfo.parseStatus === "needs_review" && (
            <div style={{ fontSize: 12, color: COLORS.text2, marginTop: "0.6rem" }}>
              {resumeInfo.extractionMethod === "ocr"
                ? "This resume was scanned — please verify the extracted details in your profile."
                : "We couldn't extract much from this resume — please review your profile and fill in any missing details."}
            </div>
          )}
          {resumeInfo.parseStatus === "failed" && resumeInfo.parseError && (
            <div style={{ fontSize: 12, color: COLORS.text2, marginTop: "0.6rem" }}>
              {resumeInfo.parseError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
