import { Dialog, DialogContent } from "./shadcn/dialog";

export default function Modal({ children, onClose, maxWidth = 480 }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} style={{ maxWidth }} className="max-h-[90vh] overflow-y-auto sm:max-w-none">
        {children}
      </DialogContent>
    </Dialog>
  );
}
