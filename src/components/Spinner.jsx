export default function Spinner({ size = 24 }) {
  return (
    <div
      className="spin"
      style={{
        width: size,
        height: size,
        border: "2px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        display: "inline-block",
      }}
    />
  );
}
