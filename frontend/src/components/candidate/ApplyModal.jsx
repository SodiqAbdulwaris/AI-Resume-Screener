import { UploadIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";

export default function ApplyModal({ job, onConfirm, onClose, loading, error }) {
  return (
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{ textAlign: "center" }}>
        <UploadIcon width={40} height={40} style={{ marginBottom: "1rem" }} />
        <h3 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Apply to {job.title}?
        </h3>
        <p style={{ color: COLORS.text2, fontSize: 13, marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Your active resume will be submitted. The recruiter will see your parsed profile.
        </p>
        <Alert message={error} variant="error" />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" fullWidth onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" fullWidth onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={16} /> : "Confirm"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
