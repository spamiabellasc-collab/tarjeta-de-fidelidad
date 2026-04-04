import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../api/supabase";

type UserProfile = {
  id: string;
  empresa_id: string | null;
  nombre: string | null;
  email: string | null;
  rol: string | null;
  activo?: boolean;
};

type AuthContextType = {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  obtenerPerfilActual: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, empresa_id, nombre, email, rol, activo")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error cargando perfil:", error);
      setProfile(null);
      return null;
    }

    console.log("Perfil cargado:", data);
    setProfile(data as UserProfile);
    return data as UserProfile;
  }

  async function obtenerPerfilActual(): Promise<UserProfile | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return fetchProfile(user.id);
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  useEffect(() => {
    let activo = true;

    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!activo) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
        if (activo) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, logout, obtenerPerfilActual }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}