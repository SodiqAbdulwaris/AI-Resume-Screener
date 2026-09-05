import { useState, useRef } from "react";
import { CheckIcon, UploadIcon, FileTextIcon, Cross2Icon } from "@radix-ui/react-icons";
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
  return <Badge variant={variant} className="gap-1">{icon}{label}</Badge>;
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
    <div className="max-w-[540px]">
      <div className="fade-up rounded-[14px] border border-border bg-card p-6">
        <h3 className="mb-1.5 text-xl font-bold text-foreground">Upload Resume</h3>
        <p className="mb-6 text-[13px] text-muted-foreground">
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
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-all ${
            dragging ? "border-primary bg-accent" : "border-border bg-transparent"
          } ${file ? "mb-4" : ""}`}
        >
          <UploadIcon width={36} height={36} className="mx-auto mb-3 text-muted-foreground" />
          <div className="mb-1 font-medium">Drop your resume here</div>
          <div className="text-[13px] text-muted-foreground">or click to browse</div>
          <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {file && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[9px] bg-secondary px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-medium"><FileTextIcon /> {file.name}</div>
              <div className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" size="sm" onClick={() => setFile(null)}><Cross2Icon /></Btn>
              <Btn variant="primary" size="sm" onClick={doUpload} disabled={loading}>
                {loading ? <Spinner size={14} /> : "Upload"}
              </Btn>
            </div>
          </div>
        )}
      </div>
      {resumeInfo && (
        <div className="fade-up-2 mt-4 rounded-[14px] border border-border bg-card p-6">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current resume</div>
          <div className="mb-1 text-sm font-medium">{resumeInfo.originalFileName}</div>
          <div className="mb-3 text-xs text-muted-foreground">
            {(resumeInfo.fileSize / 1024).toFixed(0)} KB · Uploaded {fmtDate(resumeInfo.createdAt)}
          </div>
          <ParseStatusBadge status={resumeInfo.parseStatus} />
          {resumeInfo.parseStatus === "needs_review" && (
            <div className="mt-2.5 text-xs text-muted-foreground">
              {resumeInfo.extractionMethod === "ocr"
                ? "This resume was scanned — please verify the extracted details in your profile."
                : "We couldn't extract much from this resume — please review your profile and fill in any missing details."}
            </div>
          )}
          {resumeInfo.parseStatus === "failed" && resumeInfo.parseError && (
            <div className="mt-2.5 text-xs text-muted-foreground">{resumeInfo.parseError}</div>
          )}
        </div>
      )}
    </div>
  );
}
