"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Globe, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setAuthError("");
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    if (result?.error) { setAuthError("Invalid email or password."); return; }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>

      {/* Left — decorative panel */}
      <div style={{
        display: "none", flex: "0 0 420px", background: "linear-gradient(160deg, #3b5bdb 0%, #2f4ac4 50%, #1e3a8a 100%)",
        padding: "40px", flexDirection: "column", justifyContent: "space-between",
      }}
        className="lg:flex lg:flex-col"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe style={{ width: "16px", height: "16px", color: "#fff" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>Truehost Cloud</span>
        </div>

        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: "12px" }}>
            Campus Builders<br />Programme
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "32px" }}>
            Kenya's nationwide student developer and cloud ambassador initiative across universities and TVET colleges.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Ambassadors", value: "39+" },
              { label: "Universities", value: "16+" },
              { label: "Counties", value: "12+" },
              { label: "Activities", value: "100+" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px" }}>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{s.value}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>© {new Date().getFullYear()} Truehost Cloud Kenya</p>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {/* Mobile brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#3b5bdb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe style={{ width: "15px", height: "15px", color: "#fff" }} />
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Campus Builders</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Truehost Cloud Kenya</p>
            </div>
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Sign in</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>Enter your credentials to access your account</p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {authError && (
              <div style={{
                padding: "10px 12px", borderRadius: "8px", marginBottom: "16px",
                background: "var(--danger-light)", border: "1px solid #fecaca",
                fontSize: "12px", color: "var(--danger)",
              }}>
                {authError}
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "5px" }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@university.ac.ke"
                autoComplete="email"
                style={{
                  width: "100%", height: "38px", padding: "0 12px",
                  borderRadius: "8px", border: "1px solid var(--border)",
                  background: "#fff", fontSize: "13px", color: "var(--text-primary)",
                  outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b5bdb")}
                {...register("email")}
              />
              {errors.email && <p style={{ fontSize: "11px", color: "var(--danger)", marginTop: "4px" }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "11px", color: "#3b5bdb", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: "100%", height: "38px", padding: "0 36px 0 12px",
                    borderRadius: "8px", border: "1px solid var(--border)",
                    background: "#fff", fontSize: "13px", color: "var(--text-primary)",
                    outline: "none", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b5bdb")}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                >
                  {showPassword ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: "11px", color: "var(--danger)", marginTop: "4px" }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%", height: "38px",
                background: isSubmitting ? "#7b93e8" : "#3b5bdb",
                color: "#fff", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "background 0.15s",
              }}
            >
              {isSubmitting ? (
                <svg style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Sign in <ArrowRight style={{ width: "14px", height: "14px" }} /></>
              )}
            </button>
          </form>

          <p style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            New ambassador?{" "}
            <Link href="/register" style={{ color: "#3b5bdb", fontWeight: 500, textDecoration: "none" }}>Register here</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
