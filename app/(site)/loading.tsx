/**
 * Shared route-group loading UI.
 *
 * Next.js App Router shows this file's default export IMMEDIATELY when any
 * route inside `app/(site)/` begins loading -- before the page component or
 * its data are ready. It replaces the blank white/black flash the visitor saw
 * when clicking a footer link and gives instant feedback that the click registered.
 */
export default function PageLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top progress shimmer bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          zIndex: 9999,
          background: 'linear-gradient(90deg, transparent 0%, #2ABD00 40%, #7fff00 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'qx-loading-slide 1.2s linear infinite',
        }}
      />

      {/* Centred branded pulse dot */}
      <div
        className="flex flex-1 items-center justify-center"
        role="status"
        aria-label="Loading page"
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#2ABD00',
            boxShadow: '0 0 18px 4px rgba(42,189,0,0.5)',
            animation: 'qx-loading-pulse 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes qx-loading-slide {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes qx-loading-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.9; }
          50%       { transform: scale(1.6); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
