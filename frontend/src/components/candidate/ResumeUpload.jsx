import { useState, useRef, useCallback, useEffect } from "react";
import { CheckIcon, UploadIcon, FileTextIcon, Cross2Icon, StarIcon, StarFilledIcon, TrashIcon } from "@radix-ui/react-icons";
import { fmtDate } from "../../lib/utils";
import { uploadResume, getMyResumes, setDefaultResume, deleteResume } from "../../lib/api";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

import { useOutletContext } from "react-router-dom";

const MAX_RESUMES = 5;

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
  const { token, loadAll: onUploaded } = useOutletContext();
  const [resumes, setResumes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const inputRef = useRef(null);

  const loadResumes = useCallback(async () => {
    const r = await getMyResumes(token);
    if (r.success) setResumes(r.data);
    setLoadingList(false);
  }, [token]);

  useEffect(() => { loadResumes(); }, [loadResumes]);

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
      await loadResumes();
      onUploaded();
    } else setError(r.message);
  }

  async function handleSetDefault(resumeId) {
    setBusyId(resumeId); setError(null);
    const r = await setDefaultResume(resumeId, token);
    setBusyId(null);
    if (r.success) { await loadResumes(); onUploaded(); }
    else setError(r.message);
  }

  async function handleDelete(resumeId) {
    setBusyId(resumeId); setError(null);
    const r = await deleteResume(resumeId, token);
    setBusyId(null);
    if (r.success) { await loadResumes(); onUploaded(); }
    else setError(r.message);
  }

  const atCap = resumes.length >= MAX_RESUMES;

  return (
    <div className="max-w-[640px]">
      <div className="fade-up rounded-[14px] border border-border bg-card p-6">
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <h3 className="mb-1.5 text-xl font-bold text-foreground">Resume Library</h3>
            <p className="text-[13px] text-muted-foreground">
              PDF or DOCX, max 5MB each. Keep up to {MAX_RESUMES} resumes and mark one as default.
            </p>
          </div>
        </div>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <Alert message={warning} variant="warning" />

        {atCap ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
            You've reached the {MAX_RESUMES}-resume limit. Delete one below to upload another.
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${
              dragging ? "border-primary bg-accent" : "border-border bg-transparent"
            } ${file ? "mb-4" : ""}`}
          >
            <UploadIcon width={32} height={32} className="mx-auto mb-2.5 text-muted-foreground" />
            <div className="mb-1 font-medium">Drop your resume here</div>
            <div className="text-[13px] text-muted-foreground">or click to browse</div>
            <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
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

      <div className="fade-up-2 mt-4 flex flex-col gap-3">
        {loadingList ? null : resumes.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No resumes uploaded yet.</p>
        ) : (
          resumes.map((r) => (
            <div key={r._id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border bg-card p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileTextIcon className="shrink-0" />
                  <span className="truncate">{r.originalFileName}</span>
                  {r.isDefault && <Badge variant="teal">Default</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(r.fileSize / 1024).toFixed(0)} KB · Uploaded {fmtDate(r.createdAt)}
                </div>
                <div className="mt-2">
                  <ParseStatusBadge status={r.parseStatus} />
                </div>
                {r.parseStatus === "needs_review" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {r.extractionMethod === "ocr"
                      ? "This resume was scanned — please verify the extracted details in your profile."
                      : "We couldn't extract much from this resume — please review your profile and fill in any missing details."}
                  </div>
                )}
                {r.parseStatus === "failed" && r.parseError && (
                  <div className="mt-2 text-xs text-muted-foreground">{r.parseError}</div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {!r.isDefault && (
                  <Btn variant="secondary" size="sm" onClick={() => handleSetDefault(r._id)} disabled={busyId === r._id}>
                    {busyId === r._id ? <Spinner size={14} /> : <><StarIcon /> Make default</>}
                  </Btn>
                )}
                {r.isDefault && (
                  <Btn variant="ghost" size="sm" disabled className="text-primary">
                    <StarFilledIcon /> Default
                  </Btn>
                )}
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(r._id)}
                  disabled={busyId === r._id || resumes.length <= 1}
                  title={resumes.length <= 1 ? "You must keep at least one resume" : undefined}
                >
                  <TrashIcon />
                </Btn>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
