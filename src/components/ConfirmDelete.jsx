import Modal from "./Modal";

export default function ConfirmDelete({ title, message, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
        {message || `Are you sure you want to delete "${title}"? This action cannot be undone.`}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
