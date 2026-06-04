'use client';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
      gap: '24px',
    }}>
      <div style={{ fontSize: 80 }}>📡</div>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B2545', marginBottom: 12 }}>
          You&apos;re Offline
        </h1>
        <p style={{ color: '#6B7280', fontSize: 16, maxWidth: 400 }}>
          It looks like your internet connection is unavailable. Please check your connection and try again.
        </p>
      </div>
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 12,
        padding: '16px 24px',
        maxWidth: 400,
      }}>
        <p style={{ color: '#166534', fontSize: 14, margin: 0 }}>
          💡 Previously visited pages may still be available — try using the browser back button or navigating to a page you&apos;ve visited before.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#0B2545',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
