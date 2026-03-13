/**
 * InfoPopup – in-page glass popup for status messages
 *
 * The app previously used window.alert() for things like testing Jellyfin
 * and metadata API keys. To keep the UI cinematic and avoid browser popups,
 * this component shows a small glass notification panel inside the page.
 */

interface InfoPopupProps {
  message: string;
  onClose: () => void;
}

export function InfoPopup({ message, onClose }: InfoPopupProps) {
  if (!message) return null;
  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        maxWidth: 360,
        padding: '12px 16px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{message}</div>
      <button
        type="button"
        className="btn"
        style={{ padding: '4px 8px', fontSize: 12 }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

