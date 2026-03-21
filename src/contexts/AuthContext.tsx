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

// Admin authentication context and handlers

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "user";
  department?: string;
}

interface AuthContextType {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLibraryCard: boolean;
  profile: any;
  login: (email?: string, password?: string, collegeCardId?: string) => Promise<{ success: boolean; error?: string; redirect?: string; role?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { collegeSlug: routeSlug } = useParams<{ collegeSlug: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLibraryCard, setIsLibraryCard] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (role) {
      setUser({
        role,
        name: localStorage.getItem('userName') || 'User',
        collegeSlug: localStorage.getItem('collegeSlug'),
        id: localStorage.getItem('userId'),
        isLibraryCard: localStorage.getItem('isLibraryCard') === 'true',
        cardNumber: localStorage.getItem('cardNumber'),
        email: localStorage.getItem('userEmail')
      });
      setIsAdmin(isAdmin);
      setIsSuperAdmin(isSuperAdmin);
      setIsLibraryCard(localStorage.getItem('isLibraryCard') === 'true');
    }
    setLoading(false);
  }, []);

  const login = async (email?: string, password?: string, collegeCardId?: string) => {
    try {
      const res = await fetch(`/api/${routeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, collegeCardId }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', email || '');
      localStorage.setItem('isLibraryCard', data.isLibraryCard ? 'true' : 'false');
      localStorage.setItem('userName', data.name || data.firstName || 'User');
      localStorage.setItem('cardNumber', data.cardNumber || '');
      
      if (data.role === "superadmin") {
        localStorage.setItem("isSuperAdmin", "true");
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("userName", "Super Admin");
        if (data.userId) localStorage.setItem("userId", data.userId);
        window.location.href = "/super-admin/dashboard";
        return { success: true };
      }

      if (data.role === "admin") {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("isSuperAdmin", "false");
        if (data.collegeSlug) localStorage.setItem("collegeSlug", data.collegeSlug);
        if (data.userId) localStorage.setItem("userId", data.userId);
        window.location.href = `/${data.collegeSlug || routeSlug}/admin-dashboard`;
        return { success: true };
      }

      if (data.isLibraryCard || data.role === "user") {
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("isSuperAdmin", "false");
        if (data.collegeSlug) localStorage.setItem("collegeSlug", data.collegeSlug);
        if (data.userId) localStorage.setItem("userId", data.userId);
        const target = data.isLibraryCard ? `/${routeSlug}` : data.redirect;
        window.location.href = target;
        return { success: true };
      }

      window.location.href = data.redirect || `/${routeSlug}`;
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  };

  const logout = async () => {
    localStorage.clear();
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsLibraryCard(false);
    window.location.href = `/${routeSlug}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, isLibraryCard, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
