import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: 20,
    }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 100, fontWeight: 800, color: "var(--border-hover)", margin: "0 0 16px", lineHeight: 1 }}>
          404
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Page not found
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 28px" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
