import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Key,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollege } from "@/contexts/CollegeContext";
import collegeLogo from "@/assets/images/college-logo.png";

const Login: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    collegeCardId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useCollegeCard, setUseCollegeCard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const { settings } = useCollege();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ← CRITICAL: must prevent default form submission
    setLoading(true);
    setError("");

    try {
      if (useCollegeCard) {
        if (!formData.collegeCardId || !formData.password) {
          setError("Please enter both College Card ID and Password.");
          setLoading(false);
          return;
        }

        const result = await login(
          undefined,
          formData.password,
          formData.collegeCardId,
        );

        if (!result.success) {
          setError(result.error || "Login failed");
          setLoading(false);
          return;
        }

        if (result.redirect) {
          window.location.href = result.redirect;
        }
        return;
      }

      // Default Email Login
      if (!formData.email || !formData.password) {
        setError("Please fill in email and password");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/${collegeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ← CRITICAL: needed for session cookie
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Success - Use window.location.href to force a full reload and clear state
      if (data.redirect) {
        localStorage.setItem('userRole', data.role);
        if (data.collegeSlug) localStorage.setItem('collegeSlug', data.collegeSlug);
        if (data.role === 'admin') localStorage.setItem('isAdmin', 'true');
        if (data.role === 'superadmin') localStorage.setItem('isSuperAdmin', 'true');
        if (data.userId) localStorage.setItem('userId', data.userId);
        window.location.href = data.redirect;
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 pakistan-bg pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg bg-white p-2">
            <img
              src={settings.navbarLogo || collegeLogo}
              alt={`${settings.instituteShortName} College Logo`}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your {settings.instituteShortName} account
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUseCollegeCard(false)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                !useCollegeCard
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Mail size={14} className="inline mr-1" />
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setUseCollegeCard(true)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                useCollegeCard
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <CreditCard size={14} className="inline mr-1" />
              Card ID
            </button>
          </div>

          {!useCollegeCard ? (
            <>
              <p className="text-sm text-center text-muted-foreground mb-4 bg-muted/30 p-2 rounded-lg border border-border/50">
                Staff/Visitor login through their Email & Password
              </p>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <Mail size={16} />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground mb-4 bg-muted/30 p-2 rounded-lg border border-border/50">
                Students login through their College Card ID & Password
              </p>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <CreditCard size={16} />
                  College Card ID
                </label>
                <Input
                  type="text"
                  value={formData.collegeCardId}
                  onChange={(e) =>
                    setFormData({ ...formData, collegeCardId: e.target.value })
                  }
                  placeholder="e.g., CS-E-09-12"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <Lock size={16} />
              {useCollegeCard ? "Card Login Password" : "Password"}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          {useCollegeCard ? (
            <>
              Don't have a college card?{" "}
              <Link
                to={`/${collegeSlug}/library-card`}
                className="text-primary font-medium hover:underline"
              >
                Apply for it
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <Link
                to={`/${collegeSlug}/register`}
                className="text-primary font-medium hover:underline"
              >
                Register here
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
