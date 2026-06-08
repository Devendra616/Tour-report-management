const Toast = ({ toast, onClose }) => {
  if (!toast.message) return null;

  return (
    <button
      type="button"
      className={`toast ${toast.type}`}
      onClick={onClose}
      title="Close notification"
    >
      {toast.message}
    </button>
  );
};

export default Toast;
