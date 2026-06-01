import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; step?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

/** Wraps a promise with a hard timeout — rejects with a timeout error if exceeded */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s: ${label}`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingDoneRef = useRef(false);

  function markLoadingDone() {
    if (!loadingDoneRef.current) {
      loadingDoneRef.current = true;
      setLoading(false);
    }
  }

  useEffect(() => {
    // Hard timeout — UI is never blocked longer than 4 seconds on startup
    const timeout = setTimeout(() => markLoadingDone(), 4000);

    withTimeout(supabase.auth.getSession(), 5000, "getSession")
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        setSession(session);
        setUser(session?.user ?? null);
        // Only query admins table if a session already exists (i.e. returning user)
        if (session?.user?.email) {
          withTimeout(
            supabase.from("admins").select("id").eq("email", session.user.email).maybeSingle(),
            5000,
            "checkAdmin on load"
          )
            .then(({ data }) => setIsAdmin(!!data))
            .catch(() => setIsAdmin(false))
            .finally(() => markLoadingDone());
        } else {
          markLoadingDone();
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        markLoadingDone();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setIsAdmin(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null; step?: string }> {
    // ── Step 1: Supabase Auth ────────────────────────────────────────────────
    let authResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
    try {
      authResult = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        "signInWithPassword"
      );
    } catch (err: unknown) {
      return {
        error: `Auth request timed out or failed: ${err instanceof Error ? err.message : String(err)}`,
        step: "supabase_auth",
      };
    }

    if (authResult.error) {
      return { error: authResult.error.message, step: "supabase_auth" };
    }

    // ── Step 2: Check admins table ───────────────────────────────────────────
    let adminData: { id: string } | null = null;
    try {
      const result = await withTimeout(
        supabase.from("admins").select("id").eq("email", email).maybeSingle(),
        10000,
        "admins table query"
      );
      if (result.error) {
        await supabase.auth.signOut();
        return {
          error: `Admins table error: ${result.error.message} (code: ${result.error.code})`,
          step: "admins_query",
        };
      }
      adminData = result.data as { id: string } | null;
    } catch (err: unknown) {
      await supabase.auth.signOut();
      return {
        error: `Admins table request timed out: ${err instanceof Error ? err.message : String(err)}`,
        step: "admins_query",
      };
    }

    // ── Step 3: Verify admin exists ──────────────────────────────────────────
    if (!adminData) {
      await supabase.auth.signOut();
      return {
        error: "Access denied. This email is not registered as an admin.",
        step: "not_admin",
      };
    }

    setIsAdmin(true);
    return { error: null, step: "success" };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
