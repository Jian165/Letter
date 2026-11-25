type Props = {
  message: string;
  visible: boolean;
};

export function ToastPill({ message, visible }: Props) {
  return (
    <div
      className={`toast-pill ${visible ? "show" : ""}`.trim()}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {message}
    </div>
  );
}
