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
    cardNumber?: string;
    isLibraryCard?: boolean;
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
  classification?: string; // New field for functional role
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
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name?: string;
    cardNumber?: string;
    isLibraryCard?: boolean;
  } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLibraryCard, setIsLibraryCard] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      // If we have a collegeSlug, check college-scoped endpoint
      if (collegeSlug) {
        const res = await fetch(`/api/${collegeSlug}/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser({ ...data.user, isLibraryCard: data.isLibraryCard });
          setIsAdmin(data.isAdmin || data.roles?.includes("admin") || false);
          setIsSuperAdmin(data.isSuperAdmin || false);
          setIsLibraryCard(data.isLibraryCard || false);
          if (data.profile) {
            setProfile({
              id: data.user.id,
              email: data.user.email,
              full_name: data.profile.fullName,
              role:
                data.isAdmin || data.roles?.includes("admin")
                  ? "admin"
                  : data.roles?.includes("moderator")
                    ? "moderator"
                    : "user",
              department: data.profile.department,
              phone: data.profile.phone,
              roll_number: data.profile.rollNumber,
              student_class: data.profile.studentClass,
            });
          }
          return;
        }
      }

      // If not authenticated in college or no collegeSlug, check global super-admin info
      const saRes = await fetch(`/api/super-admin/me`, { credentials: "include" });
      if (saRes.ok) {
        const saData = await saRes.json();
        setUser({ id: "super-admin", email: saData.user.email, name: "Super Admin" });
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setIsLibraryCard(false);
        setProfile(null);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsLibraryCard(false);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsLibraryCard(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [collegeSlug]);

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

      // Use the new college-scoped login route
      const res = await fetch(`/api/${collegeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      await fetchCurrentUser();
      return { 
        success: true, 
        redirect: data.redirect,
        role: data.role
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (
    userData: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/${collegeSlug}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          fullName: userData.full_name,
          phone: userData.phone,
          studentClass: userData.student_class,
          rollNumber: userData.roll_number,
          department: userData.department,
          classification: userData.classification,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      await fetchCurrentUser();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (collegeSlug) {
        await fetch(`/api/${collegeSlug}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
      // Always try global logout just in case
      await fetch(`/api/super-admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsLibraryCard(false);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isSuperAdmin,
        isLibraryCard,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
