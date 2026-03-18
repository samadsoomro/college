import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useParams } from "react-router-dom";

// SHARED ADMIN HEADERS
export const adminHeaders = () => ({
  'Content-Type': 'application/json',
  'x-admin-token': 'gcfm-admin-token-2026'
});

// DIRECT SUPABASE UPLOAD WORKAROUND
export const uploadToSupabase = async (file: File, bucket: string) => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    (import.meta as any).env.VITE_SUPABASE_URL,
    (import.meta as any).env.VITE_SUPABASE_ANON_KEY
  );
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
  return publicUrl;
};

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "user";
  department?: string;
}

interface AuthContextType {
  user: {
    id: string;
    email: string;
    role?: "superadmin" | "admin" | "user";
    collegeSlug?: string | null;
  } | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email?: string, password?: string) => Promise<{ success: boolean; error?: string; redirect?: string; role?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('isSuperAdmin') === 'true');
      setUser({ role, collegeSlug: localStorage.getItem('collegeSlug'), id: localStorage.getItem('userId') });
    }
    setLoading(false);
  }, []);

  const login = async (email?: string, password?: string) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      
      localStorage.setItem('userRole', data.role);
      if (data.collegeSlug) localStorage.setItem('collegeSlug', data.collegeSlug);
      if (data.role === 'admin') localStorage.setItem('isAdmin', 'true');
      if (data.userId) localStorage.setItem('userId', data.userId);
      
      window.location.href = data.redirect;
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  };

  const logout = async () => {
    localStorage.clear();
    setUser(null);
    setIsAdmin(false);
    window.location.href = `/${collegeSlug}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
