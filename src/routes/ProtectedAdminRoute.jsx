import AdminDashboard from "../components/AdminDashboard";
import AdminLogin from "../components/AdminLogin";
import useSupabaseSession from "../hooks/useSupabaseSession";

export default function ProtectedAdminRoute() {
  const session = useSupabaseSession();

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090202] text-white">
        <div className="rounded-2xl border border-white/10 bg-[#140404] px-6 py-5 text-sm font-black uppercase tracking-widest text-white/65">
          Loading Admin Session
        </div>
      </div>
    );
  }

  if (!session.user) {
    return (
      <AdminLogin
        error={session.error}
        loading={session.loading}
        onSignIn={session.signIn}
      />
    );
  }

  if (!session.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090202] px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#F22738]/35 bg-[#140404] p-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F2D98D]/65">
            Forbidden
          </div>
          <h1 className="mt-2 text-2xl font-black uppercase">Akun ini bukan admin.</h1>
          <button
            onClick={session.signOut}
            className="mt-6 rounded-xl bg-[#F22738] px-5 py-3 text-sm font-black uppercase text-white"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={session.signOut} adminUser={session.user} />;
}
