import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useParams } from "react-router-dom";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "user";
  department?: string;
  phone?: string;
  roll_number?: string;
  student_class?: string;
}

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: "superadmin" | "admin" | "user";
    collegeSlug?: string | null;
  } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLibraryCard: boolean;
  login: (
    email?: string,
    password?: string,
    libraryCardId?: string,
  ) => Promise<{ success: boolean; error?: string; redirect?: string; role?: string }>;
  register: (
    userData: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  student_class?: string;
  roll_number?: string;
  department?: string;
  classification?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLibraryCard, setIsLibraryCard] = useState(false);

  // 1. On init — read from localStorage:
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      const adminFlag = localStorage.getItem('isAdmin') === 'true';
      const superAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
      setIsAdmin(adminFlag || superAdminFlag);
      setIsSuperAdmin(superAdminFlag);
      setUser({
        role: role as any,
        collegeSlug: localStorage.getItem('collegeSlug'),
        id: localStorage.getItem('userId') || 'unknown',
        email: ''
      });
    }
    setLoading(false);
  }, []);

  const login = async (
    email?: string,
    password?: string,
    libraryCardId?: string,
  ): Promise<{ success: boolean; error?: string; redirect?: string; role?: string }> => {
    try {
      const body: any = {};
      if (email) body.email = email;
      if (password) body.password = password;
      if (libraryCardId) body.libraryCardId = libraryCardId;

      const res = await fetch(`/api/${collegeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Login failed" };

      if (data.redirect) {
        localStorage.setItem('userRole', data.role);
        if (data.collegeSlug) localStorage.setItem('collegeSlug', data.collegeSlug);
        if (data.role === 'admin') localStorage.setItem('isAdmin', 'true');
        if (data.role === 'superadmin') localStorage.setItem('isSuperAdmin', 'true');
        if (data.userId) localStorage.setItem('userId', data.userId);
        
        window.location.href = data.redirect;
        return { success: true, redirect: data.redirect, role: data.role };
      }
      return { success: true, role: data.role };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userData.email, password: userData.password,
          fullName: userData.full_name, phone: userData.phone,
          classification: userData.classification,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Registration failed" };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    localStorage.clear();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsLibraryCard(false);
    window.location.href = `/${collegeSlug}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isSuperAdmin, isLibraryCard, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
