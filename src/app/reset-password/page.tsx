"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = getSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0B0D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(70,208,138,0.1)", border: "1px solid rgba(70,208,138,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#46D08A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F2F4F5", margin: "0 0 12px", fontFamily: "'Libre Baskerville', serif" }}>Password updated</h1>
          <p style={{ fontSize: 14, color: "#888F96", margin: "0 0 32px", lineHeight: 1.6 }}>Your password has been reset. You can now sign in.</p>
          <a
            href="/login"
            style={{ display: "inline-block", padding: "13px 32px", background: "#F2F4F5", color: "#0A0B0D", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(91,225,239,0.12) 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 70%)" }} />

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", position: "relative", zIndex: 1 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 14, letterSpacing: "0.32em", textTransform: "uppercase", color: "#6b727a", fontWeight: 400, marginBottom: 48 }}>Semperr</div>
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#F2F4F5", margin: "0 0 8px", fontFamily: "'Libre Baskerville', serif" }}>Reset your password</h1>
        <p style={{ fontSize: 14, color: "#888F96", margin: "0 0 32px", lineHeight: 1.5 }}>Enter a new password for your account.</p>

        {!ready && (
          <div style={{ padding: "12px 16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, fontSize: 14, color: "#fbbf24", marginBottom: 20 }}>
            Verifying your reset link…
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 14, color: "#ef4444" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: "#aab0b7", marginBottom: 8, fontWeight: 500 }} htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "#F2F4F5", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: "block", fontSize: 13, color: "#aab0b7", marginBottom: 8, fontWeight: 500 }} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "#F2F4F5", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            style={{ width: "100%", padding: "14px 24px", background: "#F2F4F5", color: "#0A0B0D", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading || !ready ? "default" : "pointer", fontFamily: "inherit", opacity: loading || !ready ? 0.5 : 1 }}
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "#888F96", marginTop: 24 }}>
          <Link href="/login" style={{ color: "#5BE1EF", textDecoration: "none", fontWeight: 600 }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
