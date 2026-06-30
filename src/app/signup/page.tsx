"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [barState, setBarState] = useState("");
  const [statesCovered, setStatesCovered] = useState("");
  const [practiceAreas, setPracticeAreas] = useState("");
  const [supportNotes, setSupportNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          firmName,
          email,
          password,
          title,
          phoneNumber,
          websiteUrl,
          barNumber,
          barState,
          statesCovered: statesCovered.split(",").map((value) => value.trim()).filter(Boolean),
          practiceAreas: practiceAreas.split(",").map((value) => value.trim()).filter(Boolean),
          supportNotes,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Account created but sign-in failed. Please try logging in.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100vh", background: "#0A0B0D", color: "#C5CBD0", fontFamily: "'Inter', var(--font-body), sans-serif", fontSize: 15, position: "relative", overflow: "hidden" }}>
      {/* Global dot pattern */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(91,225,239,0.12) 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 70%)" }} />

      <div className="auth-grid">
        {/* Left branded panel */}
        <div className="auth-panel">
          {/* Background image */}
          <Image
            src="/images/signup-bg.png"
            alt=""
            fill
            sizes="500px"
            style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.35 }}
            priority
          />
          {/* Dark overlay gradient for text legibility */}
          <div className="auth-panel-overlay" />
          {/* Dot pattern on top */}
          <div className="auth-panel-dots" />
          {/* Cyan ambient glow */}
          <div style={{ position: "absolute", bottom: 0, left: "-10%", width: "120%", height: "50%", background: "radial-gradient(ellipse at 30% 80%, rgba(91,225,239,0.07) 0%, transparent 65%)", pointerEvents: "none", zIndex: 2 }} />

          {/* Top: Logo */}
          <div className="auth-reveal auth-reveal-1" style={{ position: "relative", zIndex: 3 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ fontSize: 15, letterSpacing: "0.32em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
                Semperr
              </div>
            </Link>
          </div>

          {/* Middle: Heading + subtitle */}
          <div className="auth-reveal auth-reveal-2" style={{ position: "relative", zIndex: 3 }}>
            <h1 style={{ fontFamily: "'Libre Baskerville', var(--font-heading), serif", fontSize: 42, fontWeight: 700, color: "#F2F4F5", margin: 0, lineHeight: 1.12, letterSpacing: "-0.01em", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              Fill your<br />pipeline.
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 22, lineHeight: 1.65, maxWidth: 330 }}>
              Create your account and request access for your firm.
            </p>
          </div>

          {/* Bottom: Numbered value props */}
          <div className="auth-reveal auth-reveal-3" style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ padding: "20px 22px", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                { num: "01", text: "Create your firm account" },
                { num: "02", text: "Submit your access request" },
                { num: "03", text: "Sign in once your account is ready" },
              ].map((item) => (
                <div key={item.num} className="value-prop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: "'Geist Mono', var(--font-code), monospace", fontSize: 18, color: "#5BE1EF", fontWeight: 600, minWidth: 32, letterSpacing: "-0.02em" }}>
                    {item.num}
                  </span>
                  <div style={{ width: 1, height: 18, background: "rgba(91,225,239,0.25)" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Signup form */}
        <div className="auth-form-side">
          <div className="auth-form-inner">
            <div className="auth-reveal auth-reveal-2">
              <h2 style={{ fontFamily: "'Libre Baskerville', var(--font-heading), serif", fontSize: 28, fontWeight: 700, color: "#F2F4F5", margin: 0, letterSpacing: "-0.01em" }}>
                Request access
              </h2>
              <p style={{ fontSize: 14, color: "#888F96", margin: "8px 0 36px", lineHeight: 1.5 }}>
                Create your firm account in minutes.
              </p>
            </div>

            {error && (
              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 14, color: "#ef4444" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-reveal auth-reveal-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label className="auth-label" htmlFor="firstName">First name</label>
                  <input id="firstName" type="text" className="auth-input" placeholder="Jane" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="auth-label" htmlFor="lastName">Last name</label>
                  <input id="lastName" type="text" className="auth-input" placeholder="Doe" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20 }}>
                <label className="auth-label" htmlFor="firmName">Firm name</label>
                <input id="firmName" type="text" className="auth-input" placeholder="Acme Legal LLP" autoComplete="organization" value={firmName} onChange={(e) => setFirmName(e.target.value)} required />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label className="auth-label" htmlFor="title">Your title</label>
                  <input
                    id="title"
                    type="text"
                    className="auth-input"
                    placeholder="Managing partner"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="phoneNumber">Direct phone</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    className="auth-input"
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label className="auth-label" htmlFor="barState">Bar state</label>
                  <input
                    id="barState"
                    type="text"
                    className="auth-input"
                    placeholder="CA"
                    value={barState}
                    onChange={(e) => setBarState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="auth-label" htmlFor="barNumber">Bar number</label>
                  <input
                    id="barNumber"
                    type="text"
                    className="auth-input"
                    placeholder="123456"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20 }}>
                <label className="auth-label" htmlFor="websiteUrl">Firm website</label>
                <input
                  id="websiteUrl"
                  type="url"
                  className="auth-input"
                  placeholder="https://firm.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20 }}>
                <label className="auth-label" htmlFor="statesCovered">States served</label>
                <input
                  id="statesCovered"
                  type="text"
                  className="auth-input"
                  placeholder="CA, TX, FL"
                  value={statesCovered}
                  onChange={(e) => setStatesCovered(e.target.value)}
                />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20 }}>
                <label className="auth-label" htmlFor="practiceAreas">Practice areas</label>
                <input
                  id="practiceAreas"
                  type="text"
                  className="auth-input"
                  placeholder="personal_injury, workers_comp"
                  value={practiceAreas}
                  onChange={(e) => setPracticeAreas(e.target.value)}
                />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 30 }}>
                <label className="auth-label" htmlFor="supportNotes">Support notes</label>
                <textarea
                  id="supportNotes"
                  className="auth-input"
                  placeholder="Hours, routing restrictions, preferred contact method, special instructions"
                  rows={4}
                  value={supportNotes}
                  onChange={(e) => setSupportNotes(e.target.value)}
                  style={{ resize: "vertical", minHeight: 110 }}
                />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 20 }}>
                <label className="auth-label" htmlFor="email">Work email</label>
                <input id="email" type="email" className="auth-input" placeholder="you@firm.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="auth-reveal auth-reveal-3" style={{ marginBottom: 30 }}>
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" type="password" className="auth-input" placeholder="Create a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <div className="auth-reveal auth-reveal-4">
                <button type="submit" className="auth-btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer" }}>
                  {loading ? "Creating account…" : "Create account"}
                  {!loading && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            <div className="auth-reveal auth-reveal-4">
              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "32px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <span style={{ fontSize: 12, color: "#5C636B", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              </div>

              <p style={{ textAlign: "center", fontSize: 14, color: "#888F96", margin: 0, lineHeight: 1.5 }}>
                Already have an account?{" "}
                <Link href="/login" className="auth-accent-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-grid {
          display: grid;
          grid-template-columns: 500px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        .auth-panel {
          position: relative;
          padding: 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #070809;
          border-right: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .auth-panel-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(180deg, rgba(10,11,13,0.55) 0%, rgba(10,11,13,0.25) 35%, rgba(10,11,13,0.4) 65%, rgba(10,11,13,0.85) 100%),
            linear-gradient(165deg, rgba(10,11,13,0.7) 0%, transparent 50%);
        }

        .auth-panel-dots {
          position: absolute;
          inset: 0;
          z-index: 2;
          background-image: radial-gradient(rgba(91,225,239,0.06) 1px, transparent 1px);
          background-size: 20px 20px;
          mask-image: radial-gradient(ellipse 80% 55% at 25% 45%, #000, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse 80% 55% at 25% 45%, #000, transparent 70%);
        }

        .auth-form-side {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 48px 64px;
          position: relative;
          min-height: 0;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-gutter: stable;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 720px;
          margin: auto 0;
          padding-bottom: 48px;
        }

        .auth-form-side::before {
          content: '';
          position: absolute;
          top: 15%;
          right: 10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(91,225,239,0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-label {
          display: block;
          font-size: 13px;
          color: #aab0b7;
          margin-bottom: 8px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .auth-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          color: #F2F4F5;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }

        .auth-input::placeholder {
          color: #4a5058;
        }

        .auth-input:focus {
          border-color: rgba(91,225,239,0.45);
          background: rgba(255,255,255,0.035);
          box-shadow: 0 0 0 3px rgba(91,225,239,0.08), 0 0 20px rgba(91,225,239,0.04);
        }

        .auth-btn-primary {
          width: 100%;
          padding: 14px 24px;
          background: #F2F4F5;
          color: #0A0B0D;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.01em;
        }

        .auth-btn-primary:hover {
          background: #FFFFFF;
          box-shadow: 0 8px 32px rgba(242,244,245,0.15), 0 0 60px rgba(91,225,239,0.08);
          transform: translateY(-1px);
        }

        .auth-btn-primary:active {
          transform: translateY(0);
        }

        .auth-accent-link {
          color: #5BE1EF;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.15s;
          border-bottom: 1px solid transparent;
        }

        .auth-accent-link:hover {
          border-bottom-color: rgba(91,225,239,0.4);
        }

        .value-prop {
          transition: transform 0.2s ease;
        }

        .value-prop:hover {
          transform: translateX(4px);
        }

        /* Staggered reveal animations */
        .auth-reveal {
          animation: authReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .auth-reveal-1 { animation-delay: 0s; }
        .auth-reveal-2 { animation-delay: 0.1s; }
        .auth-reveal-3 { animation-delay: 0.2s; }
        .auth-reveal-4 { animation-delay: 0.35s; }

        @keyframes authReveal {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .auth-grid {
            grid-template-columns: 1fr;
            height: auto;
            overflow: visible;
          }
          .auth-panel {
            display: none;
          }
          .auth-form-side {
            height: auto;
            min-height: 100vh;
            padding: 32px 24px;
          }
          .auth-form-inner {
            margin: 0;
            max-width: none;
            padding-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
}
