import { useCallback, useEffect, useState } from "react";
import {
  getSession,
  isCurrentUserAdmin,
  onAuthStateChange,
  signInAdmin,
  signOutAdmin,
} from "../services/authApi";

export default function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentSession = await getSession();
      setSession(currentSession);
      setIsAdmin(currentSession ? await isCurrentUserAdmin() : false);
    } catch (err) {
      setSession(null);
      setIsAdmin(false);
      setError(err.message || "Gagal membaca sesi admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      await refresh();
    };
    loadSession();
    const subscription = onAuthStateChange(() => {
      refresh();
    });
    return () => subscription?.unsubscribe?.();
  }, [refresh]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const nextSession = await signInAdmin(email, password);
      setSession(nextSession);
      setIsAdmin(true);
      return nextSession;
    } catch (err) {
      setError(err.message || "Login gagal.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await signOutAdmin();
      setSession(null);
      setIsAdmin(false);
    } catch (err) {
      setError(err.message || "Logout gagal.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    user: session?.user || null,
    isAdmin,
    loading,
    error,
    signIn,
    signOut,
    refresh,
  };
}
