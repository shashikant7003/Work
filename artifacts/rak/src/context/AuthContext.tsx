import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(email: string | undefined): Promise<boolean> {
    if (!email) {
      setIsAdmin(false);
      return false;
    }
    const { data } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    const result = !!data;
    setIsAdmin(result);
    return result;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.email).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return { error: authError.message };

      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (adminError) {
        await supabase.auth.signOut();
        return { error: "Could not verify admin access. Please try again." };
      }

      if (!adminData) {
        await supabase.auth.signOut();
        return { error: "Access denied. You are not an authorized admin." };
      }

      setIsAdmin(true);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "An unexpected error occurred." };
    }
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
