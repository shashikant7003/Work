import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  setIsAdmin: (v: boolean) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: false,
  setIsAdmin: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const resolvedRef = useRef(false);

  function resolve() {
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      setLoading(false);
    }
  }

  useEffect(() => {
    // Hard timeout: never block the UI beyond 3 seconds
    const timeout = setTimeout(resolve, 3000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Don't query admins table here — AdminLogin handles its own auth flow
        // AdminDashboard will re-check on mount
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        resolve();
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

  async function signOut() {
    await supabase.auth.signOut().catch(() => {});
    setIsAdmin(false);
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, setIsAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
