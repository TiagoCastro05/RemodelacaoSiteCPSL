import React from "react";
import "../styles/ConfirmDialog.css";

const ConfirmDialog = ({
  open,
  message,
  onConfirm,
  onCancel,
  modalRef,
  onKeyDown,
  title = "Confirmação",
}) => {
  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onKeyDown={onKeyDown}
      >
        <h3 id="confirm-dialog-title">{title}</h3>
        <p id="confirm-dialog-desc">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
