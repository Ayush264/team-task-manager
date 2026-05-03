import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <div style={{ display: "none" }} className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 39 }}
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar mobile onClose={() => setMobileOpen(false)} />
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Mobile Topbar */}
        <header style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
          className="mobile-topbar"
        >
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(true)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
            WorkPilot
          </span>
        </header>

        <main style={{ flex: 1, padding: "24px 28px", overflow: "auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-topbar { display: none !important; }
          .sidebar-desktop { display: block !important; }
        }
      `}</style>
    </div>
  );
}
