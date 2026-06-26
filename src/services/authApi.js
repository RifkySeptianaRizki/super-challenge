import { getSupabaseClient, supabase } from "../lib/supabaseClient";

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

export async function isCurrentUserAdmin() {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await client.rpc("is_admin");
  if (error) {
    throw new Error(error.message || "Gagal mengecek status admin.");
  }
  return Boolean(data);
}

export async function signInAdmin(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message || "Login gagal.");

  const admin = await isCurrentUserAdmin();
  if (!admin) {
    await client.auth.signOut();
    throw new Error("Akun ini bukan admin.");
  }

  return data.session;
}

export async function signOutAdmin() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message || "Logout gagal.");
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
