import { useState } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";

export default function AdminLogin({ error, loading, onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    try {
      await onSignIn(email, password);
    } catch (err) {
      setLocalError(err.message || "Login gagal.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090202] px-4 text-white">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#140404] p-6 shadow-2xl shadow-black/35"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F22738]">
            <LockKeyhole size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F2D98D]/65">
              Supabase Auth
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wide">Admin Login</h1>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 flex gap-3 rounded-xl border border-[#F22738]/35 bg-[#F22738]/10 p-3 text-sm text-white">
            <ShieldAlert className="mt-0.5 shrink-0 text-[#F22738]" size={18} />
            <span>{localError || error}</span>
          </div>
        )}

        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-white/45">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-white outline-none focus:border-[#F2D98D]"
            autoComplete="email"
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-widest text-white/45">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-white outline-none focus:border-[#F2D98D]"
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#F22738] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#d91f30] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "Checking..." : "Login"}
        </button>
      </form>
    </div>
  );
}
