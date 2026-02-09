import { useCallback, useEffect, useRef, useState } from "react";

const focusSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const useConfirm = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const resolveRef = useRef(null);
  const modalRef = useRef(null);

  const confirm = useCallback((text) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setMessage(text);
      setOpen(true);
    });
  }, []);

  const close = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setOpen(false);
    setMessage("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const el = modalRef.current?.querySelector(focusSelector);
      if (el) el.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(false);
        return;
      }

      if (event.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusables = modal.querySelectorAll(focusSelector);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  return {
    confirm,
    dialogProps: {
      open,
      message,
      modalRef,
      onConfirm: () => close(true),
      onCancel: () => close(false),
      onKeyDown: handleKeyDown,
    },
  };
};

export default useConfirm;
