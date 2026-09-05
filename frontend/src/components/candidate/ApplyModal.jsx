import { UploadIcon } from "@radix-ui/react-icons";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";

export default function ApplyModal({ job, onConfirm, onClose, loading, error }) {
  return (
    <Modal onClose={onClose} maxWidth={360}>
      <div className="text-center">
        <UploadIcon width={40} height={40} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="mb-3 text-xl font-bold text-foreground">Apply to {job.title}?</h3>
        <p className="mb-6 text-[13px] leading-relaxed text-muted-foreground">
          Your active resume will be submitted. The recruiter will see your parsed profile.
        </p>
        <Alert message={error} variant="error" />
        <div className="flex gap-2.5">
          <Btn variant="secondary" fullWidth onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" fullWidth onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={16} /> : "Confirm"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
