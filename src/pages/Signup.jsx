import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};

    if (!form.name.trim()) {
      e.name = "Full name is required";
    }

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) {
      e.email = "Enter a valid email";
    }

    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    const e = validate();
    setErrors(e);

    if (Object.keys(e).length) return;

    setLoading(true);

    try {
      const success = await signup({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      });

      console.log("SIGNUP SUCCESS:", success);

      toast("Account created successfully! Please login.", "success");

      // Stop loading before redirect
      setLoading(false);

      // Redirect after short delay
      setTimeout(() => {
        navigate("/login");
      }, 800);

    } catch (err) {
      console.error("SIGNUP ERROR:", err);

      toast(err.message || "Signup failed", "error");

      setLoading(false);
    }
  }

  const field = (key, label, type, placeholder) => (
    <div style={{ marginBottom: 16 }}>
      <label className="label">{label}</label>

      <input
        className={`input${errors[key] ? " input-error" : ""}`}
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [key]: e.target.value,
          }))
        }
      />

      {errors[key] && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: 12,
            marginTop: 5,
          }}
        >
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          position: "fixed",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,106,255,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          animation: "fadeInUp 0.4s ease both",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 8px 24px var(--accent-glow)",
            }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            Create account
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Join WorkPilot and start collaborating
          </p>
        </div>

        <div className="card" style={{ padding: "32px 28px" }}>
          <form onSubmit={handleSubmit}>
            {field("name", "Full Name", "text", "John Doe")}
            {field("email", "Email address", "email", "you@example.com")}
            {field("password", "Password", "password", "••••••••")}
            {field(
              "confirmPassword",
              "Confirm Password",
              "password",
              "••••••••"
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: 15,
                marginTop: 8,
              }}
            >
              {loading ? (
                <>
                  <div
                    className="spin"
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                    }}
                  />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}